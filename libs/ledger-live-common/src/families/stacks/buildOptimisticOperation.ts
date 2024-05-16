import BigNumber from "bignumber.js";
import { Account, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { StacksOperation, Transaction } from "./types";
import { getAddress } from "./bridge/utils/misc";

export const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  operatioinType: OperationType = "OUT",
): StacksOperation => {
  const hash = "";

  const { id: accountId } = account;
  const { address } = getAddress(account);

  return {
    id: encodeOperationId(accountId, hash, operatioinType),
    hash,
    type: "OUT",
    senders: [address],
    recipients: [transaction.recipient],
    accountId,
    value: transaction.amount.plus(transaction.fee || 0),
    fee: transaction.fee || new BigNumber(0),
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    transactionSequenceNumber: transaction.nonce?.toNumber() || 0,
    extra: {
      memo: transaction.memo,
    },
  };
};
