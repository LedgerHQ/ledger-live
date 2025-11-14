import { getEnv } from "@ledgerhq/live-env";
import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchAndMergeProviderData, getDefaultSwapProviderKeys } from "../../../providers/swap";
import { useFeature } from "../../../../featureFlags";

const filterProvidersByFeatureFlags = (
  providers: string[],
  ptxSwapMoonpayProviderFlag?: { enabled?: boolean },
  ptxSwapExodusProviderFlag?: { enabled?: boolean },
): string[] => {
  let filtered = providers;
  if (!ptxSwapMoonpayProviderFlag?.enabled) {
    filtered = filtered.filter(provider => provider !== "moonpay");
  }
  if (!ptxSwapExodusProviderFlag?.enabled) {
    filtered = filtered.filter(provider => provider !== "exodus");
  }
  return filtered;
};

export const useFilteredProviders = () => {
  const ptxSwapMoonpayProviderFlag = useFeature("ptxSwapMoonpayProvider");
  const ptxSwapExodusProviderFlag = useFeature("ptxSwapExodusProvider");

  const defaultProviders = useMemo(
    () =>
      filterProvidersByFeatureFlags(
        getDefaultSwapProviderKeys(),
        ptxSwapMoonpayProviderFlag ?? undefined,
        ptxSwapExodusProviderFlag ?? undefined,
      ),
    [ptxSwapMoonpayProviderFlag, ptxSwapExodusProviderFlag],
  );

  const [providers, setProviders] = useState<string[]>(defaultProviders);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchProviders = useCallback(async () => {
    try {
      const ledgerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
      const partnerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_PARTNER") ? "test" : "prod";

      const data = await fetchAndMergeProviderData({ ledgerSignatureEnv, partnerSignatureEnv });
      const filteredProviders = filterProvidersByFeatureFlags(
        Object.keys(data),
        ptxSwapMoonpayProviderFlag ?? undefined,
        ptxSwapExodusProviderFlag ?? undefined,
      );

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
