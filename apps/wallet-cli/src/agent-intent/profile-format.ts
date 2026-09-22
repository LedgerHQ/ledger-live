/** Strips `user:pass@` from a URL before it's ever displayed — `agent-intent list`/`show` must
 * never leak URL credentials. */
export function redactUrlCredentials(value: string): string {
  try {
    const url = new URL(value);
    if (!url.username && !url.password) return value;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return value;
  }
}

/** Shared by every `agent-intent` command that takes a `--profile` id, and by the session schema
 * that persists it — kept here (not under `commands/`) so `session/session-store.ts` importing it
 * doesn't reach into the command layer. */
export const PROFILE_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/;
export const PROFILE_ID_MESSAGE =
  "Profile id must contain only letters, numbers, dots, underscores, and dashes.";

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
