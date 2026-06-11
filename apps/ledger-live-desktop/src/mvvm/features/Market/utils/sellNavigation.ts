import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Account } from "@ledgerhq/types-live";

export interface SellNavigationState {
  currency: string;
  account?: string;
  mode: "sell";
  returnTo?: string;
}

export interface SellNavigationOffRampState {
  mode: "offRamp";
  defaultTicker?: string;
  returnTo?: string;
}

interface BuildSellStateParams {
  ledgerCurrency: CryptoOrTokenCurrency;
  account?: AccountLike;
  parentAccount?: Account;
  returnTo?: string;
}

export function buildSellNavigationState({
  ledgerCurrency,
  account,
  parentAccount,
  returnTo,
}: BuildSellStateParams): SellNavigationState {
  const state: SellNavigationState = {
    currency: ledgerCurrency.id,
    mode: "sell",
    returnTo,
  };

  if (account) {
    state.account = isTokenAccount(account) ? (parentAccount?.id ?? account.parentId) : account.id;
  }

  return state;
}
