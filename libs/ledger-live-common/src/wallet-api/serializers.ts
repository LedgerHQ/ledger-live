import { fromSignedOperationRaw, toSignedOperationRaw } from "../transaction";
import { RawWalletAPISignedTransaction } from "./rawTypes";
import { WalletAPISignedTransaction } from "./types";

export {
  serializeAccount as serializeWalletAPIAccount,
  deserializeAccount as deserializeWalletAPIAccount,
  serializeTransaction as serializeWalletAPITransaction,
  deserializeTransaction as deserializeWalletAPITransaction,
} from "@ledgerhq/wallet-api-core";

// FIXME: can't use SDK implementations here because SDK don't know how to properly serialize / deserialize Operation object
export function serializeWalletAPISignedTransaction(
  signedTransaction: WalletAPISignedTransaction
): RawWalletAPISignedTransaction {
  return toSignedOperationRaw(signedTransaction, true);
}
export function deserializeWalletAPISignedTransaction(
  rawSignedTransaction: RawWalletAPISignedTransaction,
  accountId: string
): WalletAPISignedTransaction {
  return fromSignedOperationRaw(rawSignedTransaction, accountId);
}
