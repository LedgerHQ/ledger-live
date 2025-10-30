import { useMemo } from "react";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import VersionNumber from "react-native-version-number";
import { getCurrencyIdsFromTickers } from "../utils";
import { useMapLedgerIdsToCoinGeckoIds } from "./useLedgerMapping";

type UseLargeMoverProps = {
  currencyIds?: string;
  ledgerIds?: string;
};

export const useLargeMover = ({ currencyIds, ledgerIds }: UseLargeMoverProps) => {
  const currenciesIds = useMemo(() => {
    if (ledgerIds) {
      return ledgerIds.split(",");
    } else {
      const currencyIdsArray = currencyIds?.split(",") || [];
      return getCurrencyIdsFromTickers(currencyIdsArray);
    }
  }, [currencyIds, ledgerIds]);

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
