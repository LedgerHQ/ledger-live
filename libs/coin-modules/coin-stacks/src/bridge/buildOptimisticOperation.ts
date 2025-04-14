import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { StacksOperation, Transaction } from "../types";
import { getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";

export const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  operatioinType: OperationType = "OUT",
): StacksOperation => {
  const hash = "";

  const { id: accountId } = account;
  const { address } = getAddress(account);

  // Check if this is a token transfer via subAccountId
  const subAccount = getSubAccount(account, transaction);
  const isTokenTransfer = !!subAccount;

  // For token transfers, use the subAccount's id
  const operationAccountId = isTokenTransfer ? subAccount.id : accountId;

  // Set the correct value based on transaction type
  // For token transfers, only the fee impacts the main account's balance
  const value: BigNumber = isTokenTransfer
    ? transaction.amount
    : transaction.amount.plus(transaction.fee || new BigNumber(0));

  return {
    id: encodeOperationId(operationAccountId, hash, operatioinType),
    hash,
    type: operatioinType,
    senders: [address],
    recipients: [transaction.recipient],
    accountId: operationAccountId,
    value,
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
