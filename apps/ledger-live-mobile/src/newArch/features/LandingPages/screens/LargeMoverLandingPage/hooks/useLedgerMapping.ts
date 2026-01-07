import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMappedAssets } from "@ledgerhq/live-common/deposit/api";

export const useLedgerMapping = () => {
  return useQuery({
    queryKey: ["ledger-mapping"],
    queryFn: getMappedAssets,
    staleTime: 1000 * 60 * 60,
    retry: 3,
    retryDelay: 1000,
  });
};

export const useMapLedgerIdsToCoinGeckoIds = (ledgerIds: string[]) => {
  const { data: mappedAssets, isLoading, error } = useLedgerMapping();

  const coinGeckoIds = React.useMemo(() => {
    if (!mappedAssets || !Array.isArray(mappedAssets)) return [];

    const mappingMap = new Map<string, string>();
    for (const asset of mappedAssets) {
      mappingMap.set(asset.ledgerId, asset.providerId);
    }

    const coinGeckoIds: string[] = [];
    for (const ledgerId of ledgerIds) {
      const coinGeckoId = mappingMap.get(ledgerId);
      if (coinGeckoId) {
        coinGeckoIds.push(coinGeckoId);
      }
    }
    return coinGeckoIds;
  }, [mappedAssets, ledgerIds]);

  return {
    coinGeckoIds,
    isLoading: isLoading,
    error,
  };
};
