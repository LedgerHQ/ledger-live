import { defineCommand, option } from "@bunli/core";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import {
  PROFILE_ID_RE,
  PROFILE_ID_MESSAGE,
  agentIntentProfileStatus,
} from "../../agent-intent/profile-format";
import { parseDurationMs } from "../../agent-intent/relay";
import {
  enrollListenerPaths,
  ErrorLineSchema,
  PendingLineSchema,
  readLogJsonLines,
} from "../../agent-intent/detach";
import { readLiveLockHolderPid } from "../../shared/file-lock";
import { CodedCommandError, createCommandOutput } from "../../output";

const POLL_INTERVAL_MS = 2_000;

/** The message of the last error envelope the listener logged, if any. */
function lastLoggedError(logPath: string): string | undefined {
  const lines = readLogJsonLines(logPath);
  for (let i = lines.length - 1; i >= 0; i--) {
    const failure = ErrorLineSchema.safeParse(lines[i]);
    if (failure.success) return failure.data.error.message;
  }
  return undefined;
}

/** The enrollment link from the listener's log, while the log still has its pending line. */
function loggedEnrollmentUrl(logPath: string, profileId: string): string | undefined {
  for (const line of readLogJsonLines(logPath)) {
    const pending = PendingLineSchema.safeParse(line);
    if (pending.success && pending.data.profileId === profileId) return pending.data.enrollmentUrl;
  }
  return undefined;
}

export default defineCommand({
  name: "wait",
  description:
    "Wait a bounded time for an `agent-intent enroll` started on this machine to complete, from " +
    "local state only, and report enrolled, still pending, or failed.",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local profile id passed to `agent-intent enroll`.",
    }),
    timeout: option(z.string().default("25s"), {
      description:
        "How long to wait before reporting a still-pending enrollment: 25s, 2m, ... (default: " +
        "25s, at most until the enrollment link expires).",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent wait",
      network: "all",
    });
    await out.run(async () => {
      const profileId = flags.profile;
      const deadline = Date.now() + parseDurationMs(flags.timeout, "timeout");
      const { logPath, lockPath } = enrollListenerPaths(profileId);

      for (;;) {
        // Read before the session: the listener saves its result before releasing the lock, so
        // once the lock reads dead, the session read below already shows anything it saved.
        const listenerPid = readLiveLockHolderPid(lockPath);
        const profile = (await Session.read()).getAgentIntentProfile(profileId);
        if (!profile) {
          // A live listener that has not saved its profile yet (keypair, keychain unlock) is starting.
          const startingMs = listenerPid === undefined ? 0 : deadline - Date.now();
          if (startingMs > 0) {
            await sleep(Math.min(POLL_INTERVAL_MS, startingMs));
            continue;
          }
          throw new CodedCommandError(
            "profile_not_found",
            `No Agent Intent profile named "${profileId}". Run \`wallet-cli agent-intent list\` ` +
              "to see your profiles.",
          );
        }
        const status = agentIntentProfileStatus(profile);
        // "recovering" is an enrolled profile with a recovery in flight: enrolled as far as this goes.
        if (profile.trustchainId && (status === "enrolled" || status === "recovering")) {
          out.agentIntentEnrolled({
            profileId,
            trustchainId: profile.trustchainId,
            accountAccessEnvironment: profile.accountAccess?.environment ?? profile.environment,
          });
          return;
        }
        // An expired link with a live listener keeps polling: an approval made just before expiry
        // may still be in `authenticate`.
        if (status === "expired" && listenerPid === undefined) {
          throw new CodedCommandError(
            "enrollment_expired",
            `The enrollment link of profile "${profileId}" expired at ` +
              `${profile.enrollmentExpiresAt} without an approval. Start a fresh enrollment with a ` +
              "new --profile id.",
          );
        }
        if (listenerPid === undefined) {
          const lastError = lastLoggedError(logPath);
          throw new CodedCommandError(
            "listener_exited",
            `The enrollment listener of profile "${profileId}" is no longer running, so the ` +
              "approval can no longer be received" +
              (lastError === undefined ? "." : ` (last error: ${lastError}).`) +
              ` Start a fresh enrollment with a new --profile id. Log: ${logPath}.`,
          );
        }

        // Capped at the expiry only while it is ahead; past it, --timeout applies as is.
        const end =
          status === "expired"
            ? deadline
            : Math.min(deadline, Date.parse(profile.enrollmentExpiresAt));
        const remainingMs = end - Date.now();
        if (remainingMs <= 0) {
          const enrollmentUrl = loggedEnrollmentUrl(logPath, profileId);
          out.agentIntentEnrollmentWaiting({
            profileId,
            expiresAt: profile.enrollmentExpiresAt,
            listenerPid,
            ...(enrollmentUrl === undefined ? {} : { enrollmentUrl }),
          });
          return;
        }
        await sleep(Math.min(POLL_INTERVAL_MS, remainingMs));
      }
    });
  },
});
