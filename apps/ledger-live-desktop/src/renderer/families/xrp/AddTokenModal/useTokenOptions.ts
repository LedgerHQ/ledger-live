import { useEffect, useMemo } from "react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { useTokensData } from "@features/platform-currencies";
import {
  enabledXrpTokenStandards,
  heldXrpTokenIds,
  standardOf,
} from "@ledgerhq/live-common/families/xrp/tokenHolding";

// The CAL groups ripple, ripple_testnet and ripple_devnet under one network family
const CAL_NETWORK_FAMILY = "ripple";

export function filterTokenOptions(tokens: TokenCurrency[], account: Account): TokenCurrency[] {
  const standards = enabledXrpTokenStandards(account.currency.id);
  const heldTokenIds = heldXrpTokenIds(account);
  return tokens.filter(
    token =>
      token.parentCurrencyId === account.currency.id &&
      !!standardOf(standards, token) &&
      !heldTokenIds.has(token.id),
  );
}

export function useTokenOptions(account: Account) {
  const { data, isLoading, isError, loadNext, refetch } = useTokensData({
    networkFamily: CAL_NETWORK_FAMILY,
  });
  const tokens = data?.tokens;

  const options = useMemo(() => filterTokenOptions(tokens ?? [], account), [tokens, account]);

  const isSearchingNextPage = options.length === 0 && !!loadNext;

  useEffect(() => {
    if (options.length === 0 && loadNext) void loadNext();
  }, [options, loadNext]);

  return {
    options,
    isLoading: isLoading || isSearchingNextPage,
    isError,
    loadNext,
    retry: refetch,
  };
}
