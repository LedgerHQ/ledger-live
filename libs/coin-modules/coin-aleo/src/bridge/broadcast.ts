import type { AccountBridge, Operation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { AleoAccount, Transaction } from "../types";
import { broadcast as logicBroadcast } from "../logic/broadcast";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const { signature, operation } = signedOperation;

  const transactionId = await logicBroadcast({
    account: account as AleoAccount,
    signedTx: signature,
  });

  let patchedOperation: Operation = operation;
  patchedOperation = patchOperationWithHash(patchedOperation, transactionId);

  return patchedOperation;
};
