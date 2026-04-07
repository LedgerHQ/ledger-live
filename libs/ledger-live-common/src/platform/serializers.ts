import { fromSignedOperationRaw, toSignedOperationRaw } from "../transaction";
import { getAccountBridgeByFamily } from "../bridge/impl";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "../currencies";
import { RawPlatformSignedTransaction } from "./rawTypes";
import { PlatformSignedTransaction } from "./types";

export {
  serializeAccount as serializePlatformAccount,
  deserializeAccount as deserializePlatformAccount,
  serializeTransaction as serializePlatformTransaction,
  deserializeTransaction as deserializePlatformTransaction,
} from "@ledgerhq/live-app-sdk";

// FIXME: can't use SDK implementations here because SDK don't know how to properly serialize / deserialize Operation object
export async function serializePlatformSignedTransaction(
  signedTransaction: PlatformSignedTransaction,
): Promise<RawPlatformSignedTransaction> {
  let bridge;
  try {
    const { currencyId } = decodeAccountId(signedTransaction.operation.accountId);
    const family = getCryptoCurrencyById(currencyId).family;
    bridge = await getAccountBridgeByFamily(family, signedTransaction.operation.accountId).catch(
      () => undefined,
    );
  } catch {
    // accountId could not be decoded — proceed without bridge
  }
  return toSignedOperationRaw(signedTransaction, true, bridge);
}
export async function deserializePlatformSignedTransaction(
  rawSignedTransaction: RawPlatformSignedTransaction,
  accountId: string,
): Promise<PlatformSignedTransaction> {
  return fromSignedOperationRaw(rawSignedTransaction, accountId);
}
