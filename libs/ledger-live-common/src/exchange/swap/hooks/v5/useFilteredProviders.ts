import { useState, useEffect, useCallback } from "react";
import { useFeature } from "../../../../featureFlags";
import { fetchAndMergeProviderData } from "../../../providers/swap";

export const useFilteredProviders = () => {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const ptxSwapMoonpayProviderFlag = useFeature("ptxSwapMoonpayProvider");
  const ptxSwapExodusProviderFlag = useFeature("ptxSwapExodusProvider");
  const ptxSwapThorswapProviderFlag = useFeature("ptxSwapThorswapProvider");

  const fetchProviders = useCallback(async () => {
    try {
      const data = await fetchAndMergeProviderData();

      let filteredProviders = Object.keys(data);
      if (!ptxSwapMoonpayProviderFlag?.enabled) {
        filteredProviders = filteredProviders.filter(provider => provider !== "moonpay");
      }
      if (!ptxSwapExodusProviderFlag?.enabled) {
        filteredProviders = filteredProviders.filter(provider => provider !== "exodus");
      }
      if (!ptxSwapThorswapProviderFlag?.enabled) {
        filteredProviders = filteredProviders.filter(provider => provider !== "thorswap");
      }

      setProviders(filteredProviders);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [ptxSwapMoonpayProviderFlag, ptxSwapExodusProviderFlag, ptxSwapThorswapProviderFlag]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return { providers, loading, error };
};
