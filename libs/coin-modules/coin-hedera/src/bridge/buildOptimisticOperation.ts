import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import {
  safeParseAccountId,
  isTokenAssociateTransaction,
  isStakingTransaction,
} from "../logic/utils";
import type { HederaAccount, HederaOperationExtra, Transaction } from "../types";

const buildOptimisticTokenAssociateOperation = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<Operation> => {
  invariant(isTokenAssociateTransaction(transaction), "invalid transaction properties");

  const estimatedFee = await estimateFees({
    currency: account.currency,
    operationType: HEDERA_OPERATION_TYPES.TokenAssociate,
  });
  const type: OperationType = "ASSOCIATE_TOKEN";

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value: estimatedFee.tinybars,
    fee: estimatedFee.tinybars,
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
      : await estimateFees({
          currency: account.currency,
          operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
        });
  const value = transaction.amount;
  const type: OperationType = transactionType ?? "OUT";
  const [_, recipientAddress] = safeParseAccountId(transaction.recipient);
  const recipientWithoutChecksum = recipientAddress?.accountId ?? transaction.recipient;
  const memo = transaction.memo;

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee: BigNumber.isBigNumber(estimatedFee) ? estimatedFee : estimatedFee.tinybars,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [recipientWithoutChecksum],
    accountId: account.id,
    date: new Date(),
    extra: {
      ...(memo && { memo }),
    } satisfies HederaOperationExtra,
  };

  return operation;
};

const buildOptimisticHTSTokenOperation = async ({
  account,
  tokenAccount,
  transaction,
}: {
  account: Account;
  tokenAccount: TokenAccount;
  transaction: Transaction;
}): Promise<Operation> => {
  const estimatedFee = await estimateFees({
    currency: account.currency,
    operationType: HEDERA_OPERATION_TYPES.TokenTransfer,
  });
  const value = transaction.amount;
  const type: OperationType = "OUT";
  const [_, recipientAddress] = safeParseAccountId(transaction.recipient);
  const recipientWithoutChecksum = recipientAddress?.accountId ?? transaction.recipient;
  const memo = transaction.memo;

  const coinOperation = await buildOptimisticCoinOperation({
    account,
    transaction: {
      ...transaction,
      amount: estimatedFee.tinybars,
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
        fee: estimatedFee.tinybars,
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress.toString()],
        recipients: [recipientWithoutChecksum],
        accountId: tokenAccount.id,
        date: new Date(),
        extra: {
          ...(memo && { memo }),
        } satisfies HederaOperationExtra,
      },
    ],
  };

  return operation;
};

const buildOptimisticERC20TokenOperation = async ({
  account,
  tokenAccount,
  transaction,
}: {
  account: Account;
  tokenAccount: TokenAccount;
  transaction: Transaction;
}): Promise<Operation> => {
  const estimatedFees = await estimateFees({
    operationType: HEDERA_OPERATION_TYPES.ContractCall,
    txIntent: {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.Send,
      asset: {
        type: "erc20",
        assetReference: tokenAccount.token.contractAddress,
        assetOwner: account.freshAddress,
      },
      amount: BigInt(transaction.amount.toString()),
      sender: account.freshAddress,
      recipient: transaction.recipient,
    },
  });
  const value = transaction.amount;
  const type: OperationType = "OUT";
  const memo = transaction.memo;

  const coinOperation = await buildOptimisticCoinOperation({
    account,
    transaction: {
      ...transaction,
      amount: estimatedFees.tinybars,
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
        fee: estimatedFees.tinybars,
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress.toString()],
        recipients: [transaction.recipient],
        accountId: tokenAccount.id,
        date: new Date(),
        extra: {
          ...(memo && { memo }),
        } satisfies HederaOperationExtra,
      },
    ],
  };

  return operation;
};

const buildOptimisticUpdateAccountOperation = async ({
  account,
  transaction,
}: {
  account: HederaAccount;
  transaction: Transaction;
}): Promise<Operation> => {
  invariant(isStakingTransaction(transaction), "invalid transaction properties");

  const estimatedFee = await estimateFees({
    operationType: HEDERA_OPERATION_TYPES.CryptoUpdate,
    currency: account.currency,
  });
  const value = transaction.amount;
  const type: OperationType = "UPDATE_ACCOUNT";

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee: estimatedFee.tinybars,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    extra: {
      memo: transaction.memo ?? null,
      targetStakingNodeId: transaction.properties?.stakingNodeId ?? null,
      previousStakingNodeId: account.hederaResources?.delegation?.nodeId ?? null,
    } satisfies Partial<HederaOperationExtra>,
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
  const isHTSTokenTransaction =
    transaction.mode === HEDERA_TRANSACTION_MODES.Send && subAccount?.token.tokenType === "hts";
  const isERC20TokenTransaction =
    transaction.mode === HEDERA_TRANSACTION_MODES.Send && subAccount?.token.tokenType === "erc20";

  if (isTokenAssociateTransaction(transaction)) {
    return buildOptimisticTokenAssociateOperation({ account, transaction });
  } else if (isHTSTokenTransaction) {
    return buildOptimisticHTSTokenOperation({ account, tokenAccount: subAccount, transaction });
  } else if (isERC20TokenTransaction) {
    return buildOptimisticERC20TokenOperation({ account, tokenAccount: subAccount, transaction });
  } else if (
    transaction.mode === HEDERA_TRANSACTION_MODES.Redelegate ||
    transaction.mode === HEDERA_TRANSACTION_MODES.Undelegate ||
    transaction.mode === HEDERA_TRANSACTION_MODES.Delegate
  ) {
    return buildOptimisticUpdateAccountOperation({ account, transaction });
  } else {
    return buildOptimisticCoinOperation({ account, transaction });
  }
};
