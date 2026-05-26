import { useMemo } from "react";
import VersionNumber from "react-native-version-number";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { getAssetDetailReceiveCurrencyIds } from "../utils/getAssetDetailReceiveCurrencyIds";

export function useAssetDetailReceiveCurrencyIds(currency: AssetDetailCurrencyProps) {
  const modularDrawerFeature = useFeature("llmModularDrawer");
  const devMode = useEnv("MANAGER_DEV_MODE");

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );

  const { data, isError, isSuccess } = assetsDataApi.useGetAssetDataQuery(
    {
      currencyIds: currency ? [currency.id] : [],
      product: "llm",
      version: VersionNumber.appVersion,
      isStaging,
      includeTestNetworks: devMode,
    },
    { skip: !currency },
  );

  return useMemo(() => {
    if (!currency) return undefined;
    if (data || isError || isSuccess) return getAssetDetailReceiveCurrencyIds(currency, data);
    return [];
  }, [currency, data, isError, isSuccess]);
}
