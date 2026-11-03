import { useCallback } from "react";
import type { GetAssetsDataParams } from "@domain/api-aggregated-assets";
import { selectCurrency } from "../currencySelection";
import { useLazyAssetData } from "./useLazyAssetData";

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
  const getAssetData = useLazyAssetData(options);

  const getLedgerCurrency = useCallback(async () => {
    if (!currency?.ledgerIds || currency.ledgerIds.length === 0) return undefined;

    const result = await getAssetData({ currencyIds: currency.ledgerIds });
    return result && selectCurrency(result);
  }, [currency, getAssetData]);

  return { getLedgerCurrency };
}
