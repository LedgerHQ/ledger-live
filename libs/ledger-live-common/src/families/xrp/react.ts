import { useEffect, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useTokensData } from "@features/platform-currencies";
import { XRP_DEV_TOKENS } from "./devTokens";
import { filterTokenOptions } from "./tokens";

// The CAL groups ripple, ripple_testnet and ripple_devnet under one network family
const CAL_NETWORK_FAMILY = "ripple";

export function useTokenOptions(account: Account) {
  const { data, isLoading, isError, loadNext, refetch } = useTokensData({
    networkFamily: CAL_NETWORK_FAMILY,
  });
  const tokens = data?.tokens;

  const options = useMemo(() => {
    // TEMP prototype: the dev tokens stand in for the testnet tokens the CAL does not list
    const devTokenIds = new Set(XRP_DEV_TOKENS.map(token => token.id));
    const calTokens = (tokens ?? []).filter(token => !devTokenIds.has(token.id));

    return filterTokenOptions([...XRP_DEV_TOKENS, ...calTokens], account);
  }, [tokens, account]);

  const isSearchingNextPage = options.length === 0 && !!loadNext && !isError;

  useEffect(() => {
    if (options.length === 0 && !isError) void loadNext?.();
  }, [options, isError, loadNext]);

  return {
    options,
    isError,
    loadNext,
    isLoading: isLoading || isSearchingNextPage,
    retry: refetch,
  };
}
