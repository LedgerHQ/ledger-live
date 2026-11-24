import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import suiConfig from "../config";
import { broadcast as logicBroadcast } from "../logic";
import { SuiSignedOperation, Transaction } from "../types";

/**
 * Broadcast the signed transaction
 * @param {Object} params - The parameters for broadcasting the transaction.
 * @param {Object} params.signedOperation - The signed operation to be broadcasted.
 * @param {Object} params.signedOperation.operation - The operation details.
 * @param {Object} params.signedOperation.rawData - The raw data of the signed operation.
 * @returns {Promise<Object>} The operation with the hash of the transaction.
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const {
    operation,
    signature,
    rawData: { unsigned, serializedSignature },
  } = signedOperation as unknown as SuiSignedOperation;
  // The raw signing path puts the serialized signed transaction in `signature` for the caller and
  // keeps the bare signature the node expects in `rawData`.
  const hash = await logicBroadcast(suiConfig.getCoinConfig(account.currency.id), {
    transactionBlock: unsigned,
    signature: serializedSignature ?? signature,
  });
  return patchOperationWithHash(operation, hash);
};
