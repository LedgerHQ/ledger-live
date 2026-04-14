import { fromSignedOperationRaw, toSignedOperationRaw } from "../transaction";
import { RawPlatformSignedTransaction } from "./rawTypes";
import { PlatformSignedTransaction } from "./types";

export {
  serializeAccount as serializePlatformAccount,
  deserializeAccount as deserializePlatformAccount,
  serializeTransaction as serializePlatformTransaction,
  deserializeTransaction as deserializePlatformTransaction,
} from "@ledgerhq/live-app-sdk";

// FIXME: can't use SDK implementations here because SDK don't know how to properly serialize / deserialize Operation object
export function serializePlatformSignedTransaction(
  signedTransaction: PlatformSignedTransaction,
): RawPlatformSignedTransaction {
  return toSignedOperationRaw(signedTransaction, true);
}
/**
 * Deserializes a raw platform signed transaction.
 *
 * @remarks
 * This function is currently synchronous but will become `async` in a future
 * migration step (LIVE-29183 — transaction serialization async prep).
 * Callers should already `await` this call so that no further changes are
 * needed once the function signature is updated.
 */
export function deserializePlatformSignedTransaction(
  rawSignedTransaction: RawPlatformSignedTransaction,
  accountId: string,
): PlatformSignedTransaction {
  return fromSignedOperationRaw(rawSignedTransaction, accountId);
}
