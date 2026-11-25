import { useEffect, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useTokensData } from "@features/platform-currencies";
import { filterTokenOptions } from "./tokens";

// The CAL groups ripple, ripple_testnet and ripple_devnet under one network family
const CAL_NETWORK_FAMILY = "ripple";

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
    isLoading: isLoading || isSearchingNextPage,
    retry: refetch,
  };
}
