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
  signedTransaction: PlatformSignedTransaction
): RawPlatformSignedTransaction {
  return toSignedOperationRaw(signedTransaction, true);
}
export function deserializePlatformSignedTransaction(
  rawSignedTransaction: RawPlatformSignedTransaction,
  accountId: string
): PlatformSignedTransaction {
  return fromSignedOperationRaw(rawSignedTransaction, accountId);
}
