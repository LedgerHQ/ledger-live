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
  listenerPaths,
  ErrorLineSchema,
  LISTENER_STARTING_MAX_MS,
  PendingLineSchema,
  readLogJsonLines,
  RingAccessGrantedLineSchema,
  RingAccessPendingLineSchema,
} from "../../agent-intent/detach";
import { readLiveLockHolderPid } from "../../shared/file-lock";
import { CodedCommandError, createCommandOutput, type CommandOutput } from "../../output";

const POLL_INTERVAL_MS = 2_000;
/** The SDK fails the relay at the link's expiry, so a pid still in the lock this long after it is
 * one an unclean exit (SIGKILL, SIGHUP) left behind, which the OS may have reused. */
const LISTENER_EXPIRY_GRACE_MS = 60_000;

/** The pending line of the profile's current enrollment, if `line` is it. Matched on the expiry
 * too: a plain `enroll` of a reused profile id leaves an earlier enrollment's log. */
function currentPendingLine(line: Record<string, unknown>, profile: AgentIntentProfileMeta) {
  const pending = PendingLineSchema.safeParse(line);
  return pending.success &&
    pending.data.profileId === profile.profileId &&
    pending.data.expiresAt === profile.enrollmentExpiresAt
    ? pending.data
    : undefined;
}

/** The last error envelope in `lines` after index `start`, if any. */
function lastErrorAfter(lines: Record<string, unknown>[], start: number) {
  for (let i = lines.length - 1; i > start; i--) {
    const failure = ErrorLineSchema.safeParse(lines[i]);
    if (failure.success) return failure.data.error;
  }
  return undefined;
}

/** The message of the last error envelope the listener logged after the current enrollment's
 * pending line, if any. */
function lastLoggedError(logPath: string, profile: AgentIntentProfileMeta): string | undefined {
  const lines = readLogJsonLines(logPath);
  const start = lines.findIndex(line => currentPendingLine(line, profile));
  return start === -1 ? undefined : lastErrorAfter(lines, start)?.message;
}

/** The enrollment link from the listener's log, while the log still has its pending line. */
function loggedEnrollmentUrl(logPath: string, profile: AgentIntentProfileMeta): string | undefined {
  for (const line of readLogJsonLines(logPath)) {
    const pending = currentPendingLine(line, profile);
    if (pending) return pending.enrollmentUrl;
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
 * prompt) is starting, for at most LISTENER_STARTING_MAX_MS, then stuck. With none, the error the
 * listener logged before its pending line is reported (e.g. a denied keychain prompt), with its own
 * code when it has one; with no such error, the profile is not found. */
function checkMissingProfile(
  out: CommandOutput,
  profileId: string,
  listenerPid: number | undefined,
  deadline: number,
): number | undefined {
  const { logPath, lockPath } = listenerPaths("enroll", profileId);
  if (listenerPid === undefined) {
    // The log of the last --detach run of this id: each spawn truncates it.
    const lines = readLogJsonLines(logPath);
    const failure = lines.some(line => PendingLineSchema.safeParse(line).success)
      ? undefined
      : lastErrorAfter(lines, -1);
    if (failure) {
      throw new CodedCommandError(
        failure.code ?? "listener_exited",
        `${failure.message} Log: ${logPath}.`,
      );
    }
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
  const lastError = lastLoggedError(logPath, profile);
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
  enrollmentUrl: string | undefined,
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
  out.agentIntentEnrollmentWaiting({
    profileId,
    expiresAt: profile.enrollmentExpiresAt,
    fingerprint: formatAgentPublicKeyFingerprint(profile.publicKey),
    keyStore: profile.keyStore,
    listenerPid: livePid,
    ...(enrollmentUrl === undefined ? {} : { enrollmentUrl }),
  });
  return undefined;
}

type RingAccessRun = {
  pending?: z.infer<typeof RingAccessPendingLineSchema>;
  linesAfter: Record<string, unknown>[];
};

function loggedRingAccessRun(
  logPath: string,
  profile: AgentIntentProfileMeta,
): RingAccessRun | undefined {
  let loggedAt: number;
  try {
    loggedAt = statSync(logPath).mtimeMs;
  } catch {
    return undefined;
  }
  if (loggedAt < Date.parse(profile.createdAt)) return undefined;
  const lines = readLogJsonLines(logPath);
  for (let i = lines.length - 1; i >= 0; i--) {
    const pending = RingAccessPendingLineSchema.safeParse(lines[i]);
    if (!pending.success) continue;
    const ownLine =
      pending.data.profileId === profile.profileId &&
      pending.data.fingerprint === formatAgentPublicKeyFingerprint(profile.publicKey);
    return ownLine ? { pending: pending.data, linesAfter: lines.slice(i + 1) } : undefined;
  }
  return { linesAfter: lines };
}

function reportRingAccessOutcome(
  out: CommandOutput,
  profileId: string,
  linesAfter: Record<string, unknown>[],
  logPath: string,
): boolean {
  const granted = linesAfter
    .map(line => RingAccessGrantedLineSchema.safeParse(line))
    .find(parsed => parsed.success);
  if (granted?.success) {
    const { environment, trustchainId, applicationPath, encryptionPublicKey } = granted.data;
    out.agentIntentRingAccessGranted({
      profileId,
      environment,
      trustchainId,
      applicationPath,
      encryptionPublicKey,
    });
    return true;
  }
  const failure = lastErrorAfter(linesAfter, -1);
  if (failure) {
    throw new CodedCommandError(
      failure.code ?? "listener_exited",
      `${failure.message} Log: ${logPath}.`,
    );
  }
  return false;
}

function checkStartingRingAccess(
  out: CommandOutput,
  profileId: string,
  listenerPid: number | undefined,
  deadline: number,
  { logPath, lockPath }: { logPath: string; lockPath: string },
  rerun: string,
): number | undefined {
  if (listenerPid === undefined) {
    throw new CodedCommandError(
      "listener_exited",
      `The ring access listener of profile "${profileId}" ended before printing its link. ` +
        `${rerun} Log: ${logPath}.`,
    );
  }
  if (lockAgeMs(lockPath) > LISTENER_STARTING_MAX_MS) {
    throw new CodedCommandError(
      "listener_stuck",
      `The ring access listener of profile "${profileId}" (pid ${listenerPid}) has not printed ` +
        `its link within ${LISTENER_STARTING_MAX_MS / 60_000} minutes, so it is stuck or its pid ` +
        `was reused. ${rerun}`,
    );
  }
  const remainingMs = deadline - Date.now();
  if (remainingMs > 0) return remainingMs;
  out.agentIntentRingAccessWaiting({ profileId, listenerPid });
  return undefined;
}

function checkPendingRingAccess(
  out: CommandOutput,
  profileId: string,
  pending: z.infer<typeof RingAccessPendingLineSchema>,
  listenerPid: number | undefined,
  deadline: number,
  logPath: string,
  rerun: string,
): number | undefined {
  const expiresAt = Date.parse(pending.expiresAt);
  const livePid = Date.now() > expiresAt + LISTENER_EXPIRY_GRACE_MS ? undefined : listenerPid;
  if (livePid === undefined) {
    if (Date.now() >= expiresAt) {
      throw new CodedCommandError(
        "ring_access_expired",
        `The ring access link of profile "${profileId}" expired at ${pending.expiresAt} without ` +
          `an answer. ${rerun}`,
      );
    }
    throw new CodedCommandError(
      "listener_exited",
      `The ring access listener of profile "${profileId}" is no longer running, so the answer ` +
        `can no longer be received. ${rerun} Log: ${logPath}.`,
    );
  }
  const expired = Date.now() >= expiresAt;
  const remainingMs = (expired ? deadline : Math.min(deadline, expiresAt)) - Date.now();
  if (remainingMs > 0) return remainingMs;
  out.agentIntentRingAccessWaiting({
    profileId,
    listenerPid: livePid,
    expiresAt: pending.expiresAt,
    ringAccessUrl: pending.ringAccessUrl,
    fingerprint: pending.fingerprint,
  });
  return undefined;
}

function checkRingAccess(
  out: CommandOutput,
  profileId: string,
  { pending, linesAfter }: RingAccessRun,
  listenerPid: number | undefined,
  deadline: number,
  paths: { logPath: string; lockPath: string },
): number | undefined {
  if (reportRingAccessOutcome(out, profileId, linesAfter, paths.logPath)) return undefined;
  const rerun = `Run \`wallet-cli agent-intent ring-access --profile ${profileId}\` again.`;
  return pending === undefined
    ? checkStartingRingAccess(out, profileId, listenerPid, deadline, paths, rerun)
    : checkPendingRingAccess(out, profileId, pending, listenerPid, deadline, paths.logPath, rerun);
}

type LinkState = { startedWithLink?: boolean };

/** A call that started before the listener logged its link hands the link over once it appears. */
function linkDeadline(state: LinkState, hasLink: boolean, deadline: number): number {
  state.startedWithLink ??= hasLink;
  return state.startedWithLink || !hasLink ? deadline : Date.now();
}

type PollContext = {
  deadline: number;
  enroll: { logPath: string; lockPath: string };
  ringAccess: { logPath: string; lockPath: string };
  enrollLink: LinkState;
  ringAccessLink: LinkState;
};

async function pollOnce(
  out: CommandOutput,
  profileId: string,
  context: PollContext,
): Promise<number | undefined> {
  // Read before the session: the listener saves its result before releasing the lock, so
  // once the lock reads dead, the session read below already shows anything it saved.
  const listenerPid = readLiveLockHolderPid(context.enroll.lockPath);
  const ringAccessPid = readLiveLockHolderPid(context.ringAccess.lockPath);
  const profile = (await Session.read()).getAgentIntentProfile(profileId);
  if (!profile) {
    linkDeadline(context.enrollLink, false, context.deadline);
    return checkMissingProfile(out, profileId, listenerPid, context.deadline);
  }
  const ringAccessRun = profile.trustchainId
    ? loggedRingAccessRun(context.ringAccess.logPath, profile)
    : undefined;
  if (ringAccessRun) {
    const deadline = linkDeadline(
      context.ringAccessLink,
      ringAccessRun.pending !== undefined,
      context.deadline,
    );
    return checkRingAccess(
      out,
      profileId,
      ringAccessRun,
      ringAccessPid,
      deadline,
      context.ringAccess,
    );
  }
  const enrollmentUrl = loggedEnrollmentUrl(context.enroll.logPath, profile);
  const deadline = linkDeadline(context.enrollLink, enrollmentUrl !== undefined, context.deadline);
  return checkProfile(out, profile, listenerPid, deadline, context.enroll.logPath, enrollmentUrl);
}

/** Polls local state until the enrollment of `profileId` is enrolled, failed, or still pending at
 * `timeoutMs` (or once its link appears, if it had none at the first poll), and reports that on
 * `out`. `intervalMs` is injectable so tests need not sleep. */
export async function pollEnrollment(
  out: CommandOutput,
  profileId: string,
  opts: { timeoutMs: number; intervalMs?: number },
): Promise<void> {
  const { timeoutMs, intervalMs = POLL_INTERVAL_MS } = opts;
  const context: PollContext = {
    deadline: Date.now() + timeoutMs,
    enroll: listenerPaths("enroll", profileId),
    ringAccess: listenerPaths("ring-access", profileId),
    enrollLink: {},
    ringAccessLink: {},
  };
  for (;;) {
    const waitMs = await pollOnce(out, profileId, context);
    if (waitMs === undefined) return;
    await sleep(Math.min(intervalMs, waitMs));
  }
}

export default defineCommand({
  name: "wait",
  description:
    "Wait a bounded time for an `agent-intent enroll`, or the last `agent-intent ring-access " +
    "--detach`, started on this machine to complete, from local state only, and report the " +
    "outcome, still pending, or failed.",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local profile id passed to `agent-intent enroll` or `ring-access`.",
    }),
    timeout: option(z.string().default("25s"), {
      description:
        "How long to wait before reporting a still-pending enrollment or ring access request: " +
        "25s, 2m, ... (default: 25s, at most until the link expires).",
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
