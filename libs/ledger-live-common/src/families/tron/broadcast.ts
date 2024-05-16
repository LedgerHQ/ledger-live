import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTron } from "./api";
import { Transaction } from "./types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation, rawData },
}) => {
  const transaction = {
    raw_data: rawData,
    txID: operation.hash,
    signature: [signature],
  };
  const submittedTransaction = await broadcastTron(transaction);

  if (submittedTransaction.result !== true) {
    throw new Error(submittedTransaction.resultMessage);
  }

  return operation;
};
