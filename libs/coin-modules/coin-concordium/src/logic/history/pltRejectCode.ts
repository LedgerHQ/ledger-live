import { isPltRejectReason } from "../../network/plt";
import type { PltRejectCode, WalletProxyRawRejectReason } from "../../types";

/**
 * Module reject `type` values this wallet can name to a user.
 *
 * CIS-7 defines six. Three are left out because they say nothing a sender can
 * act on: `mintWouldOverflow` never arises from a transfer, and
 * `deserializationFailure` and `unsupportedOperation` mean the wallet built a
 * payload the module would not take — our defect, not a user-facing state.
 *
 * `operationNotPermitted` is left out for a different reason. It covers paused,
 * allow-list and deny-list alike, and its only discriminator is a `reason`
 * string nested in `details`, as hex-encoded CBOR. `concordium-core` decodes
 * memos, not arbitrary maps, so that string cannot be read here — and naming one
 * of those causes without it would assert something unproven. It falls through
 * to `rejected` with the rest.
 *
 * A `Map` rather than an object literal because the key comes off the wire: an
 * object would resolve `constructor` and `toString` off its prototype.
 */
const MODULE_REJECT_CODES = new Map<string, PltRejectCode>([
  ["addressNotFound", "recipientNotFound"],
  ["tokenBalanceInsufficient", "insufficientBalance"],
]);

/**
 * Narrows a chain reject reason to a code the UI has copy for.
 *
 * Returns undefined when the reason is absent, belongs to another transaction
 * kind, or carries a payload that does not match its tag. The operation then
 * renders as it did before rather than gaining a cause this layer cannot
 * support — `failed` already says the transfer did not happen.
 *
 * A code is the whole output on purpose: the reason only exists once the user
 * has signed and paid the fee, so it is something to explain in history, never
 * an error to raise.
 */
export function pltRejectCode(
  reason: WalletProxyRawRejectReason | undefined,
): PltRejectCode | undefined {
  if (!isPltRejectReason(reason)) return undefined;
  if (reason.tag === "NonExistentTokenId") return "nonExistentToken";

  return MODULE_REJECT_CODES.get(reason.contents.type) ?? "rejected";
}
