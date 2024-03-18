import { findSubAccountById, getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getEnv } from "@ledgerhq/live-env";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import invariant from "invariant";

/**
 * Return weather an operation is editable or not.
 */
export const isEditableOperation = (account: Account, operation: Operation): boolean => {
  const { currency } = account;

  if (currency.family !== "evm") {
    return false;
  }

  // gasTracker is needed to perform the edit transaction logic,
  // it is used to estimate the fees and let the user choose them
  if (!currency.ethereumLikeInfo?.gasTracker) {
    return false;
  }

  // For UX reasons, we don't allow to edit the FEES operation associated to a
  // token or nft operation
  // If the operation has subOperations, it's a token operation
  // If the operation has nftOperations, it's an nft operation
  if (
    operation.type === "FEES" &&
    (operation.subOperations?.length || operation.nftOperations?.length)
  ) {
    return false;
  }

  return operation.blockHeight === null && !!operation.transactionRaw;
};

/**
 * Return weather an operation is considered stuck or not.
 */
export const isStuckOperation = (operation: Operation): boolean => {
  /**
   * pending operations that exceed the ETHEREUM_STUCK_TRANSACTION_TIMEOUT
   * threshold are considered as stuck
   */
  return (
    new Date().getTime() - operation.date.getTime() > getEnv("ETHEREUM_STUCK_TRANSACTION_TIMEOUT")
  );
};

/**
 * Return the oldest stuck pending operation and its corresponding account.
 * If no stuck pending operation is found, returns undefined
 */
export const getStuckAccountAndOperation = (
  account: AccountLike,
  parentAccount: Account | undefined | null,
):
  | {
      account: AccountLike;
      parentAccount: Account | undefined;
      operation: Operation;
    }
  | undefined => {
  let stuckAccount: AccountLike | undefined | null;
  let stuckParentAccount: Account | undefined;
  const mainAccount = getMainAccount(account, parentAccount);

  if (mainAccount.currency.family !== "evm") {
    return undefined;
  }

  const stuckOperations = mainAccount.pendingOperations.filter(
    pendingOp => isEditableOperation(mainAccount, pendingOp) && isStuckOperation(pendingOp),
  );

  if (stuckOperations.length === 0) {
    return undefined;
  }

  const oldestStuckOperation = stuckOperations.reduce((oldestOp, currentOp) => {
    return oldestOp.transactionSequenceNumber !== undefined &&
      currentOp.transactionSequenceNumber !== undefined &&
      oldestOp.transactionSequenceNumber > currentOp.transactionSequenceNumber
      ? currentOp
      : oldestOp;
  });

  if (oldestStuckOperation?.transactionRaw?.subAccountId) {
    stuckAccount = findSubAccountById(
      mainAccount,
      oldestStuckOperation.transactionRaw.subAccountId,
    );
    stuckParentAccount = mainAccount;
  } else {
    stuckAccount = mainAccount;
    stuckParentAccount = undefined;
  }

  invariant(stuckAccount, "stuckAccount required");

  return {
    account: stuckAccount,
    parentAccount: stuckParentAccount,
    operation: oldestStuckOperation,
  };
};

export default {
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
};
