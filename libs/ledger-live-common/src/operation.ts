import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import {
  isEditableOperation as isEditableOperationEvm,
  isStuckOperation as isStuckOperationEvm,
  getStuckAccountAndOperation as getStuckAccountAndOperationEvm,
} from "@ledgerhq/coin-evm/operation";
export * from "@ledgerhq/coin-framework/operation";

/**
 * Return weather an operation is editable or not.
 */
export const isEditableOperation = ({
  account,
  operation,
}: {
  account: Account;
  operation: Operation;
}): boolean => {
  if (account.currency.family === "evm") {
    return isEditableOperationEvm(account, operation);
  }

  return false;
};

/**
 * Return weather an operation is considered stuck or not.
 */
export const isStuckOperation = ({
  family,
  operation,
}: {
  family: string;
  operation: Operation;
}): boolean => {
  if (family === "evm") {
    return isStuckOperationEvm(operation);
  }

  return false;
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
  const mainAccount = getMainAccount(account, parentAccount);

  if (mainAccount.currency.family === "evm") {
    return getStuckAccountAndOperationEvm(account, parentAccount);
  }

  return undefined;
};
