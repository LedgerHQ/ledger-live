import { useMemo } from "react";
import { useFeature } from "../../featureFlags";
import { useAssetsData } from "../../modularDrawer/hooks/useAssetsData";

/**
 * Hook to fetch currencies from DaDa API as a replacement for listTokens() + listCryptoCurrencies()
 * This reuses the existing DaDa infrastructure from Modular Assets Drawer
 */
export function useDaDaCurrencies({
  product,
  version,
}: {
  product: "llm" | "lld";
  version: string;
}) {
  const modularDrawerFeature = useFeature("lldModularDrawer");

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );

  const { data, isLoading, isError, refetch } = useAssetsData({
    product,
    version,
    isStaging,
  });

  const currencies = useMemo(() => {
    if (!data?.cryptoOrTokenCurrencies) return [];
    return Object.values(data.cryptoOrTokenCurrencies);
  }, [data]);

  return {
    data: currencies,
    isLoading,
    isError,
    refetch,
  };
}
