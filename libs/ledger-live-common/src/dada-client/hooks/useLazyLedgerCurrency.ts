import { useCallback } from "react";
import { assetsDataApi } from "../state-manager/api";
import useEnv from "../../hooks/useEnv";
import { selectCurrency } from "../utils/currencySelection";

interface Currency {
  id?: string;
  ledgerIds?: string[];
}

interface LazyLedgerCurrencyOptions {
  product: "lld" | "llm";
  version: string;
}

export function useLazyLedgerCurrency(
  options: LazyLedgerCurrencyOptions,
  currency?: Currency | null,
) {
  const devMode = useEnv("MANAGER_DEV_MODE");

  const [triggerGetAssetData] = assetsDataApi.useLazyGetAssetDataQuery();

  const getLedgerCurrency = useCallback(async () => {
    if (!currency?.ledgerIds || currency.ledgerIds.length === 0) return undefined;

    try {
      const result = await triggerGetAssetData(
        {
          currencyIds: currency.ledgerIds,
          product: options.product,
          version: options.version,
          isStaging: false,
          includeTestNetworks: devMode,
        },
        true, // prefer cached data
      ).unwrap();

      return selectCurrency(result);
    } catch {
      return undefined;
    }
  }, [currency, devMode, options, triggerGetAssetData]);

  const getLedgerCurrencies = useCallback(
    async (currencyIds: string[]) => {
      if (!currencyIds || currencyIds.length === 0) return undefined;

      try {
        const result = await triggerGetAssetData(
          {
            currencyIds,
            product: options.product,
            version: options.version,
            isStaging: false,
            includeTestNetworks: devMode,
          },
          true, // prefer cached data
        ).unwrap();

        return Object.values(result.cryptoOrTokenCurrencies);
      } catch {
        return undefined;
      }
    },
    [devMode, options, triggerGetAssetData],
  );

  return { getLedgerCurrency, getLedgerCurrencies };
}
