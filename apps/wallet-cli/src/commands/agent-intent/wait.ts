import { defineCommand, option } from "@bunli/core";
import { formatAgentPublicKeyFingerprint } from "@ledgerhq/agent-intent-sdk";
import { statSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { Session, type AgentIntentProfileMeta } from "../../session/session-store";
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
import { CodedCommandError, createCommandOutput, type CommandOutput } from "../../output";

const POLL_INTERVAL_MS = 2_000;
/** The SDK fails the relay at the link's expiry, so a pid still in the lock this long after it is
 * one an unclean exit (SIGKILL, SIGHUP) left behind, which the OS may have reused. */
const LISTENER_EXPIRY_GRACE_MS = 60_000;
/** How long a live listener may hold its lock without saving its profile. A human may answer a
 * keychain unlock prompt late; past this, the listener is reported `listener_stuck`: stuck, or its
 * pid was reused. */
// todo: fixed 10 min cap, store the listener's start/expiry if prompts take longer
const LISTENER_STARTING_MAX_MS = 10 * 60_000;

/** The message of the last error envelope the listener logged, if any. */
function lastLoggedError(logPath: string): string | undefined {
  const lines = readLogJsonLines(logPath);
  for (let i = lines.length - 1; i >= 0; i--) {
    const failure = ErrorLineSchema.safeParse(lines[i]);
    if (failure.success) return failure.data.error.message;
  }
  return undefined;
}

/** The enrollment link from the listener's log, while the log still has its pending line. Matched
 * on the expiry too: a plain `enroll` of a reused profile id leaves an earlier enrollment's log. */
function loggedEnrollmentUrl(logPath: string, profile: AgentIntentProfileMeta): string | undefined {
  for (const line of readLogJsonLines(logPath)) {
    const pending = PendingLineSchema.safeParse(line);
    if (
      pending.success &&
      pending.data.profileId === profile.profileId &&
      pending.data.expiresAt === profile.enrollmentExpiresAt
    ) {
      return pending.data.enrollmentUrl;
    }
  }
  return undefined;
}

/** How long ago the lock was taken: its token is written once, on acquire. A lock released
 * meanwhile reads as fresh, so its dead pid may be reported once, until the next poll or `wait`. */
function lockAgeMs(lockPath: string): number {
  try {
    return Date.now() - statSync(lockPath).mtimeMs;
  } catch {
    return 0;
  }
}

/** Returns how long to keep polling for a profile not saved yet, or reports `enrollment-waiting`
 * at the deadline. A live listener that has not saved its profile yet (keypair, keychain unlock
 * prompt) is starting, for at most LISTENER_STARTING_MAX_MS, then stuck; with none, the profile is
 * not found. A human who answers a keychain prompt later than that is accepted as stuck too. */
function checkMissingProfile(
  out: CommandOutput,
  profileId: string,
  listenerPid: number | undefined,
  deadline: number,
  lockPath: string,
): number | undefined {
  if (listenerPid === undefined) {
    throw new CodedCommandError(
      "profile_not_found",
      `No Agent Intent profile named "${profileId}". Run \`wallet-cli agent-intent list\` ` +
        "to see your profiles.",
    );
  }
  if (lockAgeMs(lockPath) > LISTENER_STARTING_MAX_MS) {
    throw new CodedCommandError(
      "listener_stuck",
      `No Agent Intent profile named "${profileId}": its enrollment listener (pid ` +
        `${listenerPid}) has not saved it within ${LISTENER_STARTING_MAX_MS / 60_000} minutes, ` +
        "so it is stuck or its pid was reused. Start a fresh enrollment with a new --profile id.",
    );
  }
  const remainingMs = deadline - Date.now();
  if (remainingMs > 0) return remainingMs;
  out.agentIntentEnrollmentWaiting({ profileId, listenerPid });
  return undefined;
}

/** Fails when no listener can receive the approval any more. An expired link with a live listener
 * passes: a `persist` that started before expiry may still be finishing. */
function assertListenerAlive(
  profile: AgentIntentProfileMeta,
  status: ReturnType<typeof agentIntentProfileStatus>,
  listenerPid: number | undefined,
  logPath: string,
): asserts listenerPid is number {
  if (listenerPid !== undefined) return;
  const { profileId } = profile;
  if (status === "expired") {
    throw new CodedCommandError(
      "enrollment_expired",
      `The enrollment link of profile "${profileId}" expired at ` +
        `${profile.enrollmentExpiresAt} without an approval. Start a fresh enrollment with a ` +
        "new --profile id.",
    );
  }
  const lastError = lastLoggedError(logPath);
  throw new CodedCommandError(
    "listener_exited",
    `The enrollment listener of profile "${profileId}" is no longer running, so the ` +
      "approval can no longer be received" +
      (lastError === undefined ? "." : ` (last error: ${lastError}).`) +
      ` Start a fresh enrollment with a new --profile id. Log: ${logPath}.`,
  );
}

/** Reports a final result and returns undefined, or returns how long to keep polling. */
function checkProfile(
  out: CommandOutput,
  profile: AgentIntentProfileMeta,
  listenerPid: number | undefined,
  deadline: number,
  logPath: string,
): number | undefined {
  const { profileId } = profile;
  const status = agentIntentProfileStatus(profile);
  // "recovering" is an enrolled profile with a recovery in flight: enrolled as far as this goes.
  if (profile.trustchainId && (status === "enrolled" || status === "recovering")) {
    out.agentIntentEnrolled({
      profileId,
      trustchainId: profile.trustchainId,
      accountAccessEnvironment: profile.accountAccess?.environment ?? profile.environment,
      keyStore: profile.keyStore,
    });
    return undefined;
  }
  const pastGrace = Date.now() > Date.parse(profile.enrollmentExpiresAt) + LISTENER_EXPIRY_GRACE_MS;
  const livePid = pastGrace ? undefined : listenerPid;
  assertListenerAlive(profile, status, livePid, logPath);

  // Capped at the expiry only while it is ahead; past it, --timeout applies as is.
  const end =
    status === "expired" ? deadline : Math.min(deadline, Date.parse(profile.enrollmentExpiresAt));
  const remainingMs = end - Date.now();
  if (remainingMs > 0) return remainingMs;
  const enrollmentUrl = loggedEnrollmentUrl(logPath, profile);
  out.agentIntentEnrollmentWaiting({
    profileId,
    expiresAt: profile.enrollmentExpiresAt,
    fingerprint: formatAgentPublicKeyFingerprint(profile.publicKey),
    listenerPid: livePid,
    ...(enrollmentUrl === undefined ? {} : { enrollmentUrl }),
  });
  return undefined;
}

/** Polls local state until the enrollment of `profileId` is enrolled, failed, or still pending at
 * `timeoutMs`, and reports that on `out`. `intervalMs` is injectable so tests need not sleep. */
export async function pollEnrollment(
  out: CommandOutput,
  profileId: string,
  opts: { timeoutMs: number; intervalMs?: number },
): Promise<void> {
  const { timeoutMs, intervalMs = POLL_INTERVAL_MS } = opts;
  const deadline = Date.now() + timeoutMs;
  const { logPath, lockPath } = enrollListenerPaths(profileId);

  for (;;) {
    // Read before the session: the listener saves its result before releasing the lock, so
    // once the lock reads dead, the session read below already shows anything it saved.
    const listenerPid = readLiveLockHolderPid(lockPath);
    const profile = (await Session.read()).getAgentIntentProfile(profileId);
    const waitMs = profile
      ? checkProfile(out, profile, listenerPid, deadline, logPath)
      : checkMissingProfile(out, profileId, listenerPid, deadline, lockPath);
    if (waitMs === undefined) return;
    await sleep(Math.min(intervalMs, waitMs));
  }
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
    await out.run(() =>
      pollEnrollment(out, flags.profile, {
        timeoutMs: parseDurationMs(flags.timeout, "timeout"),
      }),
    );
  },
});
