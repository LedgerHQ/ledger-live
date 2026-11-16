import { useEffect, useMemo } from "react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { useTokensData } from "@features/platform-currencies";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";

// The CAL groups ripple, ripple_testnet and ripple_devnet under one network family
const CAL_NETWORK_FAMILY = "ripple";

export function filterTokenOptions(tokens: TokenCurrency[], account: Account): TokenCurrency[] {
  const enabledStandards: string[] = getXrpEnabledTokenStandards(account.currency.id);

  return tokens.filter(token => {
    const isOnAccountNetwork = token.parentCurrencyId === account.currency.id;
    const isEnabled = enabledStandards.includes(token.tokenType);
    const isIssuedByAccount = token.contractAddress === account.freshAddress;

    return isOnAccountNetwork && isEnabled && !token.delisted && !isIssuedByAccount;
  });
}

export function useTokenOptions(account: Account) {
  const { data, isLoading, isError, loadNext, refetch } = useTokensData({
    networkFamily: CAL_NETWORK_FAMILY,
  });
  const tokens = data?.tokens;

  const options = useMemo(() => filterTokenOptions(tokens ?? [], account), [tokens, account]);

  const isSearchingNextPage = options.length === 0 && !!loadNext && !isError;

  useEffect(() => {
    if (options.length === 0 && !isError) void loadNext?.();
  }, [options, isError, loadNext]);

  return {
    options,
    isError,
    loadNext,
    retry: refetch,
    isLoading: isLoading || isSearchingNextPage,
  };
}
