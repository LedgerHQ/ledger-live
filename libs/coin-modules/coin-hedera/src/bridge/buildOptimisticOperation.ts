import invariant from "invariant";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { HederaAccount, HederaOperationExtra, Transaction } from "../types";
import { getEstimatedFees } from "./utils";
import { isStakingTransaction } from "../logic";

const buildOptimisticStakingOperation = async ({
  account,
  transaction,
}: {
  account: HederaAccount;
  transaction: Transaction;
}): Promise<Operation> => {
  invariant(isStakingTransaction(transaction), "invalid transaction properties");

  const estimatedFee = await getEstimatedFees(account, "CryptoUpdate");
  const value = transaction.amount;
  const type: OperationType = "UPDATE_ACCOUNT";

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
    extra: {
      memo: transaction.memo ?? null,
      targetStakingNodeId: transaction.properties?.stakingNodeId ?? null,
      previousStakingNodeId: account.hederaResources?.delegation?.nodeId ?? null,
    } satisfies Partial<HederaOperationExtra>,
  };

  return operation;
};

const buildOptimisticCoinOperation = async ({
  account,
  transaction,
  transactionType,
}: {
  account: HederaAccount;
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

export const buildOptimisticOperation = async ({
  account,
  transaction,
}: {
  account: HederaAccount;
  transaction: Transaction;
}): Promise<Operation> => {
  if (isStakingTransaction(transaction)) {
    return buildOptimisticStakingOperation({ account, transaction });
  } else {
    return buildOptimisticCoinOperation({ account, transaction });
  }
};
