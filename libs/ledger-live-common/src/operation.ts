import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { getCurrencyConfiguration } from "./config";
import {
  loadGetStuckAccountAndOperationForFamily,
  loadIsEditableOperationForFamily,
  loadIsStuckOperationForFamily,
} from "./coin-modules/registry";
export * from "@ledgerhq/ledger-wallet-framework/operation";

function hasGasTracker(currency: CryptoCurrency): boolean {
  const config = getCurrencyConfiguration<EvmConfigInfo>(currency.id);
  return !!config.gasTracker;
}

export const isEditableOperation = ({
  account,
  operation,
}: {
  account: Account;
  operation: Operation;
}): boolean =>
  loadIsEditableOperationForFamily(account.currency.family)?.(account, operation, hasGasTracker) ??
  false;

export const isStuckOperation = ({
  family,
  operation,
}: {
  family: string;
  operation: Operation;
}): boolean => loadIsStuckOperationForFamily(family)?.(operation) ?? false;

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
  return loadGetStuckAccountAndOperationForFamily(mainAccount.currency.family)?.(
    account,
    parentAccount,
    hasGasTracker,
  );
};
