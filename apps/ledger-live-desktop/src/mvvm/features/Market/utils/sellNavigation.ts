import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Account } from "@ledgerhq/types-live";

export interface SellNavigationState {
  currency: string;
  account?: string;
  mode: "sell";
}

export interface SellNavigationOffRampState {
  mode: "offRamp";
  defaultTicker?: string;
}

interface BuildSellStateParams {
  ledgerCurrency: CryptoOrTokenCurrency;
  account?: AccountLike;
  parentAccount?: Account;
}

export function buildSellNavigationState({
  ledgerCurrency,
  account,
  parentAccount,
}: BuildSellStateParams): SellNavigationState {
  const state: SellNavigationState = {
    currency: ledgerCurrency.id,
    mode: "sell",
  };

  if (account) {
    state.account = isTokenAccount(account) ? (parentAccount?.id ?? account.parentId) : account.id;
  }

  return state;
}
