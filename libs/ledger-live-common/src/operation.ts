import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import {
  isEditableOperation as isEditableOperationEvm,
  isStuckOperation as isStuckOperationEvm,
  getStuckAccountAndOperation as getStuckAccountAndOperationEvm,
} from "@ledgerhq/coin-evm/operation";
import {
  isStuckOperation as isStuckOperationBitcoin,
  getStuckAccountAndOperation as getStuckAccountAndOperationBitcoin,
  isEditableOperation as isEditableOperationBitcoin,
} from "@ledgerhq/coin-bitcoin/operation";
import { getCurrencyConfiguration } from "./config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
export * from "@ledgerhq/coin-framework/operation";

function hasGasTracker(currency: CryptoCurrency): boolean {
  const config = getCurrencyConfiguration<EvmConfigInfo>(currency);
  return !!config.gasTracker;
}

/**
 * Return whether an operation is editable or not.
 */
export const isEditableOperation = ({
  account,
  operation,
}: {
  account: Account;
  operation: Operation;
}): boolean => {
  if (account.currency.family === "evm") {
    return isEditableOperationEvm(account, operation, hasGasTracker);
  } else if (account.currency.family === "bitcoin") {
    return isEditableOperationBitcoin(account, operation);
  }

  return false;
};

/**
 * Return whether an operation is considered stuck or not.
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
  } else if (family === "bitcoin") {
    return isStuckOperationBitcoin(operation);
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
    return getStuckAccountAndOperationEvm(account, parentAccount, hasGasTracker);
  } else if (mainAccount.currency.family === "bitcoin") {
    return getStuckAccountAndOperationBitcoin(account, parentAccount);
  }

  return undefined;
};
