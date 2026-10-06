import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { isAccountEmpty } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { AccountLike, Account } from "@ledgerhq/types-live";

export interface SwapNavigationState {
  defaultAmountFrom: string;
  from: string;
  defaultCurrency: { toCurrencyId: string };
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
    defaultCurrency: { toCurrencyId: defaultCurrency.id },
  };

  // A token is identified by `toTokenId`, whether or not an account comes with it:
  // `toCurrencyId` alone leaves the Swap live app's receive field empty for tokens.
  if (isTokenCurrency(defaultCurrency)) {
    baseState.defaultToken = { toTokenId: defaultCurrency.id };
  }

  if (account) {
    const parentAccountId =
      parentAccount?.id ?? (isTokenAccount(account) ? account.parentId : undefined);

    if (isTokenAccount(account) && isAccountEmpty(account) && parentAccountId) {
      baseState.defaultAccountId = parentAccountId;
    } else {
      baseState.defaultAccountId = account.id;
      baseState.defaultParentAccountId = parentAccountId;
    }
  }

  return baseState;
}
