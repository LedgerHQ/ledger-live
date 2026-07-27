import { useMemo } from "react";
import { useAssetsData } from "@features/platform-aggregated-assets";
import VersionNumber from "react-native-version-number";
import { parseLargeMoverLedgerIds } from "~/navigation/deeplinks/validation";
import { useMapLedgerIdsToCoinGeckoIds } from "./useLedgerMapping";

type UseLargeMoverProps = {
  ledgerIds: string;
};

export const useLargeMover = ({ ledgerIds }: UseLargeMoverProps) => {
  const currenciesIds = useMemo(() => parseLargeMoverLedgerIds(ledgerIds), [ledgerIds]);

  const {
    coinGeckoIds: chartIds,
    isLoading: mappingLoading,
    error: mappingError,
  } = useMapLedgerIdsToCoinGeckoIds(currenciesIds);

  const {
    data: currencies,
    isLoading: loading,
    isError,
  } = useAssetsData({
    currencyIds: currenciesIds,
    product: "llm",
    version: VersionNumber.appVersion,
    areCurrenciesFiltered: true,
  });

  return {
    currencies,
    currenciesIds,
    chartIds,
    loading: loading || mappingLoading,
    isError: isError || !!mappingError,
  };
};
