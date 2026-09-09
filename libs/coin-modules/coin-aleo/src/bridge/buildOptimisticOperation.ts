import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AleoOperation, AleoOperationExtra, Transaction } from "../types";
import {
  getFunctionNameFromTransactionType,
  getNextSequenceNumber,
  getOperationTransactionType,
  getStakingOperationType,
  isTokenTransaction,
} from "../logic/utils";

// `transaction.recipient` is the validator for BOND but the staker itself for
// UNBOND/WITHDRAW_UNBONDED (see prepareTransaction), so only BOND's is a counterparty.
function resolveStakingExtra(
  stakingType: OperationType | undefined,
  transaction: Transaction,
): Partial<AleoOperationExtra> {
  switch (stakingType) {
    case "BOND":
      return { validator: transaction.recipient, stakedAmount: transaction.amount };
    case "UNBOND":
      return { stakedAmount: transaction.amount };
    default:
      return {};
  }
}

export function buildOptimisticOperation({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): AleoOperation {
  const fee = transaction.fees;
  const isTokenTx = isTokenTransaction(transaction);
  const stakingType = getStakingOperationType(transaction.mode);
  const value = isTokenTx || stakingType ? fee : transaction.amount;
  const mainOperationType: OperationType = isTokenTx ? "FEES" : (stakingType ?? "OUT");
  const subOperations: Operation[] = [];
  const tokenSubAccount = account.subAccounts?.find(s => s.id === transaction.subAccountId);
  const transactionSequenceNumber = getNextSequenceNumber(account);
  const extra: AleoOperationExtra = {
    functionId: getFunctionNameFromTransactionType(transaction.mode),
    transactionType: getOperationTransactionType(transaction.mode),
  };
  const stakingExtra = resolveStakingExtra(stakingType, transaction);

  if (isTokenTx && tokenSubAccount) {
    const subOperationType: OperationType = "OUT";
    const tokenOp: Operation = {
      id: encodeOperationId(tokenSubAccount.id, "", subOperationType),
      hash: "",
      type: subOperationType,
      value: transaction.amount,
      fee,
      blockHash: null,
      blockHeight: null,
      senders: [account.freshAddress],
      recipients: [transaction.recipient],
      accountId: tokenSubAccount.id,
      date: new Date(),
      transactionSequenceNumber,
      extra,
    };

    subOperations.push(tokenOp);
  }

  const operation: AleoOperation = {
    id: encodeOperationId(account.id, "", mainOperationType),
    hash: "",
    type: mainOperationType,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    // Staking moves funds between the account's own balances, so there is no counterparty to
    // show; every other staking family leaves both empty and the details drawer then omits the
    // From/To sections entirely (it keys off array length, and `[""]` would render a blank row).
    senders: stakingType ? [] : [account.freshAddress],
    recipients: stakingType ? [] : [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    transactionSequenceNumber,
    extra: { ...extra, ...stakingExtra },
    ...(subOperations.length > 0 && { subOperations }),
  };

  return operation;
}
