import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Account } from "@ledgerhq/types-live";

export interface SwapNavigationState {
  defaultAmountFrom: string;
  from: string;
  defaultCurrency: string;
  defaultToken?: { toTokenId: string };
  defaultAccountId?: string;
  defaultParentAccountId?: string;
}

interface BuildSwapStateParams {
  defaultCurrency: CryptoOrTokenCurrency;
  fromPath: string;
  account?: AccountLike;
  parentAccount?: Account;
}

export function buildSwapNavigationState({
  defaultCurrency,
  fromPath,
  account,
  parentAccount,
}: BuildSwapStateParams): SwapNavigationState {
  const baseState: SwapNavigationState = {
    defaultAmountFrom: "0",
    from: fromPath,
    defaultCurrency: defaultCurrency.id,
  };

  if (isTokenCurrency(defaultCurrency) && !account) {
    baseState.defaultToken = { toTokenId: defaultCurrency.id };
  }

  if (account) {
    baseState.defaultAccountId = account.id;
    baseState.defaultParentAccountId =
      parentAccount?.id ?? (isTokenAccount(account) ? account.parentId : undefined);
  }

  return baseState;
}
