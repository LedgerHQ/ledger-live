import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Account } from "@ledgerhq/types-live";

export interface BuyNavigationState {
  currency: string;
  account?: string;
  mode: "buy";
  returnTo?: string;
}

export interface BuyNavigationOnRampState {
  mode: "onRamp";
  defaultTicker?: string;
  returnTo?: string;
}

interface BuildBuyStateParams {
  ledgerCurrency: CryptoOrTokenCurrency;
  account?: AccountLike;
  parentAccount?: Account;
  returnTo?: string;
}

export function buildBuyNavigationState({
  ledgerCurrency,
  account,
  parentAccount,
  returnTo,
}: BuildBuyStateParams): BuyNavigationState {
  const state: BuyNavigationState = {
    currency: ledgerCurrency.id,
    mode: "buy",
    returnTo,
  };

  if (account) {
    state.account = isTokenAccount(account) ? (parentAccount?.id ?? account.parentId) : account.id;
  }

  return state;
}
