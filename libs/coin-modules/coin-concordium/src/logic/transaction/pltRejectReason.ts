import { isPltRejectReason } from "../../network/plt";
import {
  ConcordiumInsufficientFunds,
  ConcordiumNonExistentTokenId,
  ConcordiumPltTransferRejected,
  ConcordiumRecipientNotFound,
} from "../../types/errors";
import type { WalletProxyRawRejectReason } from "../../types";

/**
 * Module reject `type` values this layer narrows to a typed error.
 *
 * CIS-7 defines six (`addressNotFound`, `tokenBalanceInsufficient`,
 * `deserializationFailure`, `unsupportedOperation`, `operationNotPermitted`,
 * `mintWouldOverflow`), but only these two say something a sender can act on:
 *
 * - `mintWouldOverflow` never arises from a transfer.
 * - `deserializationFailure` and `unsupportedOperation` mean the wallet built a
 *   payload the module would not take — a bug here, not a user-facing state.
 * - `operationNotPermitted` covers paused, allow-list and deny-list alike. The
 *   only discriminator is a `reason` string inside `details`, which arrives as
 *   hex-encoded CBOR that this repo has no decoder for, so it cannot be
 *   narrowed and falls through to the generic error.
 *
 * The set is open regardless: a module may define its own types, and the node
 * truncates the value to 255 bytes without re-validating UTF-8, so an
 * unrecognised or mangled string is expected input rather than a defect.
 *
 * A `Map` rather than an object literal because the key comes off the wire: an
 * object would resolve `constructor` and `toString` off its prototype.
 */
const MODULE_REJECT_ERRORS = new Map<string, () => Error>([
  ["addressNotFound", () => new ConcordiumRecipientNotFound()],
  ["tokenBalanceInsufficient", () => new ConcordiumInsufficientFunds()],
]);

/**
 * Maps a chain reject reason onto a typed PLT error.
 *
 * Returns `undefined` when the reason is absent, belongs to another
 * transaction kind, or carries a payload that does not match its tag — the
 * caller keeps whatever generic failure it already had rather than claiming a
 * PLT cause it cannot support.
 *
 * This is a backstop. A reject reason only exists once the user has signed and
 * paid the fee, so the pre-send checks own every failure worth preventing.
 */
export function mapPltRejectReason(
  reason: WalletProxyRawRejectReason | undefined,
): Error | undefined {
  if (!isPltRejectReason(reason)) return undefined;

  if (reason.tag === "NonExistentTokenId") {
    return new ConcordiumNonExistentTokenId(undefined, { tokenId: reason.contents });
  }

  const { tokenId, type } = reason.contents;
  return (
    MODULE_REJECT_ERRORS.get(type)?.() ??
    new ConcordiumPltTransferRejected(undefined, { tokenId, type })
  );
}
