import invariant from "invariant";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import { HEDERA_OPERATION_TYPES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { isTokenAssociateTransaction, safeParseAccountId } from "../logic/utils";
import type { HederaOperationExtra, Transaction } from "../types";

const buildOptimisticTokenAssociateOperation = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<Operation> => {
  invariant(isTokenAssociateTransaction(transaction), "invalid transaction properties");

  const estimatedFee = await estimateFees(account.currency, HEDERA_OPERATION_TYPES.TokenAssociate);
  const type: OperationType = "ASSOCIATE_TOKEN";

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value: estimatedFee,
    fee: estimatedFee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    extra: {
      associatedTokenId: transaction.properties.token.contractAddress,
    } satisfies HederaOperationExtra,
  };

  return operation;
};

const buildOptimisticCoinOperation = async ({
  account,
  transaction,
  transactionType,
}: {
  account: Account;
  transaction: Transaction;
  transactionType?: OperationType;
}): Promise<Operation> => {
  const estimatedFee =
    transactionType === "FEES"
      ? transaction.amount
      : await estimateFees(account.currency, HEDERA_OPERATION_TYPES.CryptoTransfer);
  const value = transaction.amount;
  const type: OperationType = transactionType ?? "OUT";
  const [_, recipientAddress] = safeParseAccountId(transaction.recipient);
  const recipientWithoutChecksum = recipientAddress?.accountId ?? transaction.recipient;

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee: estimatedFee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [recipientWithoutChecksum],
    accountId: account.id,
    date: new Date(),
    extra: {
      ...(!!transaction.memo && { memo: transaction.memo }),
    },
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
  const estimatedFee = await estimateFees(account.currency, HEDERA_OPERATION_TYPES.TokenTransfer);
  const value = transaction.amount;
  const type: OperationType = "OUT";
  const [_, recipientAddress] = safeParseAccountId(transaction.recipient);
  const recipientWithoutChecksum = recipientAddress?.accountId ?? transaction.recipient;

  const coinOperation = await buildOptimisticCoinOperation({
    account,
    transaction: {
      ...transaction,
      recipient: tokenAccount.token.contractAddress,
      amount: estimatedFee,
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
        recipients: [recipientWithoutChecksum],
        accountId: tokenAccount.id,
        date: new Date(),
        extra: {
          ...(!!transaction.memo && { memo: transaction.memo }),
        },
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

  if (isTokenAssociateTransaction(transaction)) {
    return buildOptimisticTokenAssociateOperation({ account, transaction });
  } else if (isTokenTransaction) {
    return buildOptimisticTokenOperation({ account, tokenAccount: subAccount, transaction });
  } else {
    return buildOptimisticCoinOperation({ account, transaction });
  }
};
