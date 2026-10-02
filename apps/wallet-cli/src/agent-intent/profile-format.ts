// Matches literal `user:pass@` userinfo even when `value` isn't a well-formed URL `new URL()` can
// parse — e.g. a truncated/hand-edited `session.yaml` entry like `https://user:secret@` (a real
// example: WHATWG rejects that outright since it has no host). Fails closed rather than open: the
// point of this pattern is to catch exactly the inputs `new URL()` can't.
const USERINFO_PATTERN = /:\/\/[^/\s@]*@/;

/** Strips `user:pass@` from a URL before it's ever displayed — `agent-intent list`/`show` must
 * never leak URL credentials, including from a value that isn't a well-formed URL at all (a
 * corrupted or hand-edited session record isn't guaranteed to be one). */
export function redactUrlCredentials(value: string): string {
  try {
    const url = new URL(value);
    if (!url.username && !url.password) return value;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return USERINFO_PATTERN.test(value) ? value.replace(USERINFO_PATTERN, "://") : value;
  }
}

/** Whether a URL carries Basic Auth-style userinfo (`user:pass@host`). A malformed URL reports
 * `false` here — validating that the value is a well-formed URL at all is a separate, prior check
 * (e.g. `z.string().url()`), not this function's job. */
export function hasUrlCredentials(value: string): boolean {
  try {
    const url = new URL(value);
    return url.username !== "" || url.password !== "";
  } catch {
    return false;
  }
}

/** Shared by every `agent-intent` command that takes a `--profile` id, and by the session schema
 * that persists it — kept here (not under `commands/`) so `session/session-store.ts` importing it
 * doesn't reach into the command layer. */
export const PROFILE_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/;
export const PROFILE_ID_MESSAGE =
  "Profile id must contain only letters, numbers, dots, underscores, and dashes.";

/** Shared wording for `agent-intent list`/`show` when the session has profile ids that failed to
 * load. `undefined` when there's nothing to warn about. */
export function formatInvalidAgentIntentProfilesWarning(
  ids: readonly string[],
): string | undefined {
  if (ids.length === 0) return undefined;
  return (
    `⚠ ${ids.length} Agent Intent profile(s) failed to load (invalid session record): ` +
    `${ids.join(", ")}.\n` +
    `  Each record is kept as-is in session.yaml but ignored until it is fixed there. Removing ` +
    `it instead orphans its OS-keychain secret.\n`
  );
}

export type AgentIntentProfileStatus = "enrolled" | "pending" | "expired";

/** Structural rather than importing `AgentIntentProfileMeta` from `session-store.ts`, to avoid a
 * circular import (session-store.ts imports `PROFILE_ID_RE` from this module). */
export function agentIntentProfileStatus(
  profile: { trustchainId?: string; enrollmentExpiresAt: string },
  now: Date = new Date(),
): AgentIntentProfileStatus {
  if (profile.trustchainId) return "enrolled";
  return new Date(profile.enrollmentExpiresAt) < now ? "expired" : "pending";
}
