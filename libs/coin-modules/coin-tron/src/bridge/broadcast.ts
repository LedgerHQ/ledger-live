import type { Account, AccountBridge, Operation, SignedOperation } from "@ledgerhq/types-live";
import { broadcast as broadcastLogic } from "../logic/broadcast";
import type { Transaction } from "../types";

const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation, rawData },
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const transaction = {
    raw_data: rawData,
    txID: operation.hash,
    signature: [signature],
  };
  await broadcastLogic(transaction);

  return operation;
};

export default broadcast;
