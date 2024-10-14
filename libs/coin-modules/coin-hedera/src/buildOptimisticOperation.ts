import { Account, Operation } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getEstimatedFees } from "./utils";
import { Transaction } from "./types";

export const buildOptimisticOperation = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<Operation> => {
  const operation: Operation = {
    id: encodeOperationId(account.id, "", "OUT"),
    hash: "",
    type: "OUT",
    value: transaction.amount,
    fee: await getEstimatedFees(account),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    extra: {},
  };

  return operation;
};
