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

export const isEditableOperation = async ({
  account,
  operation,
}: {
  account: Account;
  operation: Operation;
}): Promise<boolean> => {
  const fn = await loadIsEditableOperationForFamily(account.currency.family);
  return fn?.(account, operation, hasGasTracker) ?? false;
};

export const isStuckOperation = async ({
  family,
  operation,
}: {
  family: string;
  operation: Operation;
}): Promise<boolean> => {
  const fn = await loadIsStuckOperationForFamily(family);
  return fn?.(operation) ?? false;
};

export const getStuckAccountAndOperation = async (
  account: AccountLike,
  parentAccount: Account | undefined | null,
): Promise<
  | {
      account: AccountLike;
      parentAccount: Account | undefined;
      operation: Operation;
    }
  | undefined
> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const fn = await loadGetStuckAccountAndOperationForFamily(mainAccount.currency.family);
  return fn?.(account, parentAccount, hasGasTracker);
};
