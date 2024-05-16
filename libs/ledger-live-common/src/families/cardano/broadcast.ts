import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { submitTransaction } from "./api/submitTransaction";
import { Transaction } from "./types";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation,
  account,
}) => {
  const signedTx = signedOperation.signature;
  const pendingTransaction = await submitTransaction({
    transaction: signedTx,
    currency: account.currency,
  });

  return patchOperationWithHash(signedOperation.operation, pendingTransaction.hash);
};

export default broadcast;
