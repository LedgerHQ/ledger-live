import type { AgentIntentHttpError } from "@ledgerhq/agent-intent-sdk";

const MAX_DETAIL_LENGTH = 300;

// Matched by `name`, not `instanceof`: the SDK is a separate package, so its classes can exist
// twice in a bundle and fail an `instanceof` check.
function isHttpError(e: unknown): e is AgentIntentHttpError {
  return e instanceof Error && e.name === "AgentIntentHttpError";
}

function isSdkError(e: unknown): e is Error {
  return e instanceof Error && e.name === "AgentIntentSdkError";
}

/** The SDK throws this after a 2xx whose body isn't a URL: the intent exists, only its review
 * link is missing, so the caller must report success rather than invite a duplicate retry. */
export function isAcceptedWithoutReviewLink(e: unknown): boolean {
  return isSdkError(e) && /invalid intent deeplink/i.test(e.message);
}

/**
 * Makes service- or network-supplied text safe to print: the SDK passes a non-JSON response body
 * through verbatim, and a fetch failure message can embed the request URL. Strips URL userinfo and
 * bearer tokens, key-sized hex runs (a 32-byte secp256k1 secret is 64 hex characters, shorter
 * than the generic threshold), long token-like runs (same threshold the SDK's own auth errors
 * use), and truncates. EVM addresses (40 hex characters) stay readable.
 */
export function redactServiceText(text: string): string {
  const redacted = text
    .replace(/:\/\/[^/\s@]*@/g, "://")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(0x)?[0-9a-fA-F]{64,}/g, "[redacted]")
    .replace(/[A-Za-z0-9_\-.~+/=]{80,}/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim();
  return redacted.length > MAX_DETAIL_LENGTH
    ? `${redacted.slice(0, MAX_DETAIL_LENGTH)}…`
    : redacted;
}

const RE_ENROLL = (profileId: string) =>
  `Re-enroll with \`wallet-cli agent-intent enroll\` under a new --profile id ` +
  `(profile "${profileId}" can't be reused).`;

/** Messages for authentication and Trustchain-membership failures, shared by every request. */
function accessErrorMessage(
  e: AgentIntentHttpError,
  profileId: string,
  detail: string,
): string | null {
  switch (e.type) {
    case "not_a_member":
    case "ambiguous_trustchain":
    case "unexpected_caller":
    case "wrong_client_type":
      return (
        `Profile "${profileId}" is not an active agent on its Trustchain (${detail}). The ` +
        `enrollment may have been revoked. ${RE_ENROLL(profileId)}`
      );
    case "token_expired":
    case "token_invalid":
      return (
        `Authentication with the Agent Intent service failed even after re-authenticating ` +
        `(${detail}). Check that profile "${profileId}"'s enrollment is still active.`
      );
  }
  return null;
}

function httpErrorMessage(e: AgentIntentHttpError, profileId: string): string {
  const detail = redactServiceText(e.message);
  const access = accessErrorMessage(e, profileId, detail);
  if (access) return access;
  switch (e.type) {
    case "pubkey_mismatch":
      return (
        `The Agent Intent service rejected the intent: its issuer does not match the authenticated ` +
        `agent (${detail}). The OS-keychain key for profile "${profileId}" doesn't belong to its ` +
        `enrollment. ${RE_ENROLL(profileId)}`
      );
    case "signature_invalid":
    case "signature_malformed":
    case "malformed_intent":
      return (
        `The Agent Intent service rejected the intent as invalid (${detail}). This usually means ` +
        `wallet-cli and the service disagree on the intent format — retrying unchanged won't help.`
      );
    case "nonce_reused":
      return `The Agent Intent service saw a reused nonce (${detail}). Re-run the command; each run signs with a fresh nonce.`;
  }
  if (e.status === 404) {
    return (
      `The Agent Intent service doesn't know profile "${profileId}" (${detail}). Its enrollment ` +
      `was never completed on the service side or was removed. ${RE_ENROLL(profileId)}`
    );
  }
  if (e.status >= 500) {
    return (
      `The Agent Intent service failed (HTTP ${e.status}: ${detail}). The intent may still have ` +
      "been created — check the Agent Intent frontend before re-running, or you may propose a " +
      "duplicate."
    );
  }
  return `The Agent Intent service rejected the request (HTTP ${e.status}: ${detail}).`;
}

/**
 * Turns anything thrown while authenticating or submitting an intent into an actionable,
 * credential-free error. Deliberately drops `cause`: the original error can carry a raw response
 * body or a request URL that must never reach output or logs.
 */
export function describeAgentIntentError(e: unknown, profileId: string): Error {
  if (isHttpError(e)) return new Error(httpErrorMessage(e, profileId));
  const message = redactServiceText(e instanceof Error ? e.message : String(e));
  if (isSdkError(e)) {
    if (/authentication request failed/i.test(message)) {
      return new Error(
        `Could not authenticate profile "${profileId}" with Agent Intent (${message}). Check the ` +
          "network/VPN, and that the profile's enrollment is still active.",
      );
    }
    return new Error(`Agent Intent request failed: ${message}`);
  }
  return new Error(
    `Could not reach the Agent Intent service (${message}). Check the network/VPN, then look for ` +
      "the intent in the Agent Intent frontend before re-running — a timeout can hide a success.",
  );
}

function lookupErrorMessage(e: AgentIntentHttpError, profileId: string, intentId: string): string {
  if (e.status === 404) {
    return (
      `Profile "${profileId}" has no intent ${intentId}: it doesn't exist, or another agent ` +
      "created it (the service answers both the same way). Run `agent-intent intents` to see " +
      "this profile's intents."
    );
  }
  if (e.status === 400) {
    return `The Agent Intent service rejected intent id ${intentId} (${redactServiceText(e.message)}).`;
  }
  // A service from before agent point reads answers an agent token with this, not 404.
  if (e.type === "unexpected_caller") {
    return (
      "This Agent Intent service doesn't let agents read a single intent yet. Use " +
      "`agent-intent intents` to see the status of this profile's intents instead."
    );
  }
  return listErrorMessage(e, profileId);
}

function listErrorMessage(e: AgentIntentHttpError, profileId: string): string {
  const detail = redactServiceText(e.message);
  const access = accessErrorMessage(e, profileId, detail);
  if (access) return access;
  if (e.status === 400) {
    return (
      `The Agent Intent service rejected the listing (${detail}). Check --status and --page-size; ` +
      `a --cursor only works with the profile and filters of the listing that returned it.`
    );
  }
  if (e.status === 429) {
    return `The Agent Intent service is rate-limiting requests (${detail}). Wait a moment and re-run.`;
  }
  if (e.status >= 500) {
    return `The Agent Intent service failed (HTTP ${e.status}: ${detail}). Re-run the command later.`;
  }
  return `The Agent Intent service rejected the listing (HTTP ${e.status}: ${detail}).`;
}

/**
 * Like {@link describeAgentIntentError}, for read-only listing requests: nothing is created, so a
 * failure is always safe to retry.
 */
export function describeAgentIntentListError(e: unknown, profileId: string): Error {
  return describeReadError(e, profileId, httpError => listErrorMessage(httpError, profileId));
}

/** Like {@link describeAgentIntentListError}, for reading one intent: a 404 means "not yours". */
export function describeAgentIntentLookupError(
  e: unknown,
  profileId: string,
  intentId: string,
): Error {
  return describeReadError(e, profileId, httpError =>
    lookupErrorMessage(httpError, profileId, intentId),
  );
}

/**
 * Like {@link describeAgentIntentLookupError}, for cancelling one intent: a repeat is a no-op on the
 * service, so a failure is safe to retry too.
 */
export function describeAgentIntentCancelError(
  e: unknown,
  profileId: string,
  intentId: string,
): Error {
  return describeAgentIntentLookupError(e, profileId, intentId);
}

function describeReadError(
  e: unknown,
  profileId: string,
  httpMessage: (e: AgentIntentHttpError) => string,
): Error {
  if (isHttpError(e)) return new Error(httpMessage(e));
  const message = redactServiceText(e instanceof Error ? e.message : String(e));
  if (isSdkError(e)) {
    if (/authentication request failed/i.test(message)) {
      return new Error(
        `Could not authenticate profile "${profileId}" with Agent Intent (${message}). Check the ` +
          "network/VPN, and that the profile's enrollment is still active.",
      );
    }
    return new Error(`Agent Intent request failed: ${message}`);
  }
  return new Error(
    `Could not reach the Agent Intent service (${message}). Check the network/VPN and re-run.`,
  );
}
