import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { StellarOperation, Transaction } from "../types";
import { getAmountValue } from "./logic";
import { fetchSequence } from "../network";

export async function buildOptimisticOperation(
  account: Account,
  transaction: Transaction,
): Promise<StellarOperation> {
  const transactionSequenceNumber = await fetchSequence(account);
  const fees = transaction.fees ?? new BigNumber(0);
  const type = transaction.mode === "changeTrust" ? "OPT_IN" : "OUT";

  const operation: StellarOperation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value: transaction.subAccountId ? fees : getAmountValue(account, transaction, fees),
    fee: fees,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    transactionSequenceNumber: transactionSequenceNumber?.plus(1).toNumber(),
    extra: {
      ledgerOpType: type,
      blockTime: new Date(),
      index: "0",
    },
  };

  const { subAccountId } = transaction;
  const { subAccounts } = account;

  const tokenAccount = !subAccountId
    ? null
    : subAccounts && subAccounts.find(ta => ta.id === subAccountId);

  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: `${subAccountId}--OUT`,
        hash: "",
        type: "OUT",
        value: transaction.useAllAmount ? tokenAccount.balance : transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        accountId: subAccountId,
        date: new Date(),
        extra: {
          ledgerOpType: type,
        },
      },
    ];
  }

  return operation;
}
