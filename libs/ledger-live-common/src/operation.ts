import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import byFamily from "./generated/operation";

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
  const specific = byFamily[account.currency.family];

  if (specific?.isEditableOperation) {
    return specific.isEditableOperation(account, operation);
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
  const specific = byFamily[family];

  if (specific?.isStuckOperation) {
    return specific.isStuckOperation(operation);
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

  const specific = byFamily[mainAccount.currency.family];

  if (specific?.getStuckAccountAndOperation) {
    return specific.getStuckAccountAndOperation(account, parentAccount);
  }

  return undefined;
};
