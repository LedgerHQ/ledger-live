import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
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
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({ signedOperation }) => {
  const {
    operation,
    signature,
    rawData: { unsigned },
  } = signedOperation as unknown as SuiSignedOperation;
  const params = {
    transactionBlock: unsigned,
    signature,
    options: {
      showInput: true,
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
    },
  };
  const hash = await logicBroadcast(params);
  return patchOperationWithHash(operation, hash);
};
