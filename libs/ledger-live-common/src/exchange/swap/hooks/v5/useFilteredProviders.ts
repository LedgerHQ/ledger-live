import { getEnv } from "@ledgerhq/live-env";
import { useCallback, useEffect, useState } from "react";
import { fetchAndMergeProviderData } from "../../../providers/swap";
import { useFeature } from "../../../../featureFlags";

export const useFilteredProviders = () => {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const ptxSwapMoonpayProviderFlag = useFeature("ptxSwapMoonpayProvider");
  const ptxSwapExodusProviderFlag = useFeature("ptxSwapExodusProvider");
  const fetchProviders = useCallback(async () => {
    try {
      const ledgerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
      const partnerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_PARTNER") ? "test" : "prod";

      const data = await fetchAndMergeProviderData({ ledgerSignatureEnv, partnerSignatureEnv });
      let filteredProviders = Object.keys(data);
      if (!ptxSwapMoonpayProviderFlag?.enabled) {
        filteredProviders = filteredProviders.filter(provider => provider !== "moonpay");
      }
      if (!ptxSwapExodusProviderFlag?.enabled) {
        filteredProviders = filteredProviders.filter(provider => provider !== "exodus");
      }

      setProviders(filteredProviders);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [ptxSwapMoonpayProviderFlag, ptxSwapExodusProviderFlag]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return { providers, loading, error };
};
