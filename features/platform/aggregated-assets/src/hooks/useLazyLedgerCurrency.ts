import { useCallback } from "react";
import { assetsDataApi, type GetAssetsDataParams } from "@domain/api-aggregated-assets";
import useEnv from "@features/platform-env";
import { selectCurrency } from "../currencySelection";

/* Structural: the caller passes live-common's MarketCurrencyData, which this layer cannot import. */
interface CurrencyWithLedgerIds {
  id?: string;
  ledgerIds?: string[];
}

type LazyLedgerCurrencyOptions = Pick<GetAssetsDataParams, "product" | "version">;

export function useLazyLedgerCurrency(
  options: LazyLedgerCurrencyOptions,
  currency?: CurrencyWithLedgerIds | null,
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

  return { getLedgerCurrency };
}
