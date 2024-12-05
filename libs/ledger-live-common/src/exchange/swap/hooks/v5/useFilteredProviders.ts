import { getEnv } from "@ledgerhq/live-env";
import { useCallback, useEffect, useState } from "react";
import { fetchAndMergeProviderData } from "../../../providers/swap";

export const useFilteredProviders = () => {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchProviders = useCallback(async () => {
    try {
      const ledgerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
      const partnerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_PARTNER") ? "test" : "prod";

      const data = await fetchAndMergeProviderData({ ledgerSignatureEnv, partnerSignatureEnv });

      const filteredProviders = Object.keys(data);

      setProviders(filteredProviders);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return { providers, loading, error };
};
