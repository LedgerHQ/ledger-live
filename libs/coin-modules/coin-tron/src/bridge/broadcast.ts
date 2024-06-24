import { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { broadcastTron } from "../network";

const broadcast = async ({
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
  const submittedTransaction = await broadcastTron(transaction);

  if (submittedTransaction.result !== true) {
    throw new Error(submittedTransaction.resultMessage);
  }

  return operation;
};

export default broadcast;
