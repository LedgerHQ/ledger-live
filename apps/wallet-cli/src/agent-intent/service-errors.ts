import { AgentIntentHttpError, AgentIntentSdkError } from "@ledgerhq/agent-intent-sdk";

const MAX_DETAIL_LENGTH = 300;

/**
 * Makes service- or network-supplied text safe to print: the SDK passes a non-JSON response body
 * through verbatim, and a fetch failure message can embed the request URL. Strips URL userinfo and
 * bearer tokens, key-sized hex runs (a 32-byte secp256k1 secret is 64 hex characters, shorter
 * than the generic threshold), long token-like runs (same threshold the SDK's own auth errors
 * use), and truncates. EVM addresses (40 hex characters) stay readable.
 */
export function redactServiceText(text: string): string {
  const redacted = text
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^/\s@]*@/gi, "$1")
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
  `Re-enroll with \`wallet-cli agent-intent enroll\` + \`complete\` under a new --profile id ` +
  `(profile "${profileId}" can't be reused).`;

function httpErrorMessage(e: AgentIntentHttpError, profileId: string): string {
  const detail = redactServiceText(e.message);
  switch (e.type) {
    case "pubkey_mismatch":
      return (
        `The Agent Intent service rejected the intent: its issuer does not match the authenticated ` +
        `agent (${detail}). The OS-keychain key for profile "${profileId}" doesn't belong to its ` +
        `enrollment. ${RE_ENROLL(profileId)}`
      );
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
    return `The Agent Intent service is temporarily unavailable (HTTP ${e.status}: ${detail}). No intent was created — try again later.`;
  }
  return `The Agent Intent service rejected the request (HTTP ${e.status}: ${detail}).`;
}

/**
 * Turns anything thrown while authenticating or submitting an intent into an actionable,
 * credential-free error. Deliberately drops `cause`: the original error can carry a raw response
 * body or a request URL that must never reach output or logs.
 */
export function describeAgentIntentError(e: unknown, profileId: string): Error {
  if (e instanceof AgentIntentHttpError) return new Error(httpErrorMessage(e, profileId));
  const message = redactServiceText(e instanceof Error ? e.message : String(e));
  if (e instanceof AgentIntentSdkError) {
    if (/invalid intent deeplink/i.test(message)) {
      return new Error(
        "The Agent Intent service accepted the request but returned an unreadable review link, so " +
          "the intent was most likely created. Check the Agent Intent frontend before re-running, " +
          "or you may propose a duplicate.",
      );
    }
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
