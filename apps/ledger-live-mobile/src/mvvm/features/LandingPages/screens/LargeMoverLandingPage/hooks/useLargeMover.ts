import { useMemo } from "react";
import { useAssetsData } from "@features/platform-aggregated-assets";
import { appVersion } from "LLM/utils/appVersion";
import { parseLargeMoverLedgerIds } from "../utils/parseLargeMoverLedgerIds";

type UseLargeMoverProps = {
  ledgerIds: string;
};

export const useLargeMover = ({ ledgerIds }: UseLargeMoverProps) => {
  const currenciesIds = useMemo(() => parseLargeMoverLedgerIds(ledgerIds), [ledgerIds]);

  const {
    data: currencies,
    isLoading: loading,
    isError,
  } = useAssetsData({
    currencyIds: currenciesIds,
    product: "llm",
    version: appVersion,
    areCurrenciesFiltered: true,
  });

  return {
    currencies,
    currenciesIds,
    loading,
    isError,
  };
};
