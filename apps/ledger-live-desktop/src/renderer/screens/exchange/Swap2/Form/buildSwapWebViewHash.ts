import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { AccountNamesState } from "@domain/entity-account-name";
import type { SwapDefaultAccounts } from "./useSwapDefaultAccounts";

type TokenParams = {
  fromTokenId?: string;
  toTokenId?: string;
};

export type SwapLocationState = {
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
  defaultAccountId?: string | { fromAccountId?: string; toAccountId?: string };
  defaultParentAccountId?: string;
  defaultCurrency?: { id?: string; fromCurrencyId?: string; toCurrencyId?: string };
  defaultAmountFrom?: string;
  from?: string;
  defaultToken?: TokenParams;
  affiliate?: string;
};

/** Remove the account id from the from path. */
function simplifyFromPath(path: string): string {
  return path.replace(/^\/account.*/, "/account/{id}");
}

type BuildSwapWebViewHashParams = {
  state: SwapLocationState | null;
  defaultAccounts: SwapDefaultAccounts;
  accountNames: AccountNamesState;
  isOffline: boolean;
};

/**
 * Query string appended to the Swap live app manifest URL. It is the only channel through
 * which a caller can pre-fill the live app, so every entry point ultimately lands here.
 */
export function buildSwapWebViewHash({
  state,
  defaultAccounts,
  accountNames,
  isOffline,
}: BuildSwapWebViewHashParams): string {
  const {
    rawFromAccountId,
    rawToAccountId,
    resolvedDefaultFromAccount,
    resolvedDefaultFromParentAccount,
    resolvedDefaultToAccount,
    resolvedDefaultToParentAccount,
  } = defaultAccounts;

  // Recompute wallet-API ids when possible; otherwise keep raw deeplink ids.
  const fromAccountIdForUrl = resolvedDefaultFromAccount
    ? accountToWalletAPIAccount(
        accountNames,
        resolvedDefaultFromAccount,
        resolvedDefaultFromParentAccount,
      ).id
    : rawFromAccountId;
  const toAccountIdForUrl = resolvedDefaultToAccount
    ? accountToWalletAPIAccount(
        accountNames,
        resolvedDefaultToAccount,
        resolvedDefaultToParentAccount,
      ).id
    : rawToAccountId;

  return new URLSearchParams({
    ...(isOffline ? { isOffline: "true" } : {}),
    ...(fromAccountIdForUrl ? { fromAccountId: fromAccountIdForUrl } : {}),
    ...(toAccountIdForUrl
      ? {
          toAccountId: toAccountIdForUrl,
          amountFrom: state?.defaultAmountFrom || "",
        }
      : {}),
    ...(state?.from
      ? {
          fromPath: simplifyFromPath(state.from),
        }
      : {}),
    ...(state?.defaultToken?.fromTokenId ? { fromTokenId: state.defaultToken.fromTokenId } : {}),
    // `toToken` is the legacy alias of `toTokenId`; the Earn live app sends both, so we match
    // it rather than depend on which one a given Swap live app version reads.
    ...(state?.defaultToken?.toTokenId
      ? { toTokenId: state.defaultToken.toTokenId, toToken: state.defaultToken.toTokenId }
      : {}),
    ...(state?.defaultToken ? { amountFrom: state?.defaultAmountFrom || "" } : {}),
    ...(state?.defaultCurrency?.toCurrencyId || state?.defaultCurrency?.id
      ? { toCurrencyId: state!.defaultCurrency!.toCurrencyId ?? state!.defaultCurrency!.id }
      : {}),
    ...(state?.defaultCurrency?.fromCurrencyId
      ? { fromCurrencyId: state.defaultCurrency.fromCurrencyId }
      : {}),
    ...(state?.defaultAmountFrom
      ? {
          amountFrom: state.defaultAmountFrom,
        }
      : {}),
    ...(state?.affiliate
      ? {
          affiliate: state.affiliate,
        }
      : {}),
  }).toString();
}
