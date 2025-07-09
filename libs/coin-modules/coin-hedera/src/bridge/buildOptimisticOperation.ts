import BigNumber from "bignumber.js";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { Transaction } from "../types";
import { getEstimatedFees } from "./utils";

const buildOptimisticCoinOperation = async ({
  account,
  transaction,
  transactionType,
}: {
  account: Account;
  transaction: Transaction;
  transactionType?: OperationType;
}): Promise<Operation> => {
  const estimatedFee = await getEstimatedFees(account, "CryptoTransfer");
  const value = transaction.amount;
  const type: OperationType = transactionType ?? "OUT";

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee: estimatedFee,
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

const buildOptimisticTokenOperation = async ({
  account,
  tokenAccount,
  transaction,
}: {
  account: Account;
  tokenAccount: TokenAccount;
  transaction: Transaction;
}): Promise<Operation> => {
  const estimatedFee = await getEstimatedFees(account, "TokenTransfer");
  const value = transaction.amount;
  const type: OperationType = "OUT";

  const coinOperation = await buildOptimisticCoinOperation({
    account,
    transaction: {
      ...transaction,
      recipient: tokenAccount.token.contractAddress,
      amount: new BigNumber(0),
    },
    transactionType: "FEES",
  });

  const operation: Operation = {
    ...coinOperation,
    subOperations: [
      {
        id: encodeOperationId(tokenAccount.id, "", type),
        hash: "",
        type,
        value,
        fee: estimatedFee,
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress.toString()],
        recipients: [transaction.recipient],
        accountId: tokenAccount.id,
        date: new Date(),
        extra: {},
      },
    ],
  };

  return operation;
};

export const buildOptimisticOperation = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<Operation> => {
  const subAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = isTokenAccount(subAccount);

  if (isTokenTransaction) {
    return buildOptimisticTokenOperation({ account, tokenAccount: subAccount, transaction });
  } else {
    return buildOptimisticCoinOperation({ account, transaction });
  }
};
