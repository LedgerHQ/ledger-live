import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { galleryChainFiltersSelector } from "~/reducers/nft";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { SupportedBlockchain } from "@ledgerhq/live-nft/lib/supported";

export function useChains() {
  const llmSolanaNftsEnabled = useFeature("llmSolanaNfts")?.enabled || false;
  const SUPPORTED_NFT_CURRENCIES = useEnv("NFT_CURRENCIES");
  const chainFilters = useSelector(galleryChainFiltersSelector);

  const isChainDisplayable = useCallback(
    (currency: string) =>
      SUPPORTED_NFT_CURRENCIES.includes(currency) &&
      (currency !== "solana" || llmSolanaNftsEnabled),
    [SUPPORTED_NFT_CURRENCIES, llmSolanaNftsEnabled],
  );

  const chainFiltersFiltered = useMemo(
    () =>
      Object.entries(chainFilters).reduce<Record<SupportedBlockchain, boolean>>(
        (acc, [key, value]) => {
          if (isChainDisplayable(key)) {
            acc[key as SupportedBlockchain] = value;
          }
          return acc;
        },
        {} as Record<SupportedBlockchain, boolean>,
      ),
    [chainFilters, isChainDisplayable],
  );

  const activeChains = useMemo(
    () =>
      Object.keys(chainFiltersFiltered).filter(
        key => chainFiltersFiltered[key as SupportedBlockchain],
      ),
    [chainFiltersFiltered],
  );

  return {
    chains: activeChains,
    chainFilters: chainFiltersFiltered,
  };
}
