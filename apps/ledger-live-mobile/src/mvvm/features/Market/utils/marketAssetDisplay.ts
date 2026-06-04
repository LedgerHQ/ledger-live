import { KeysPriceChange, MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { formatPrice } from "@ledgerhq/live-currency-format";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { TFunction } from "i18next";
import BigNumber from "bignumber.js";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { counterValueFormatter } from "./index";

interface MapOptions {
  counterCurrency: string;
  counterValueUnit: Unit;
  range: KeysPriceChange;
  locale: string;
  t: TFunction;
}

export function mapMarketCurrencyToDisplayData(
  item: MarketCurrencyData,
  { counterCurrency, counterValueUnit, range, locale, t }: MapOptions,
): MarketAssetDisplayData {
  const change = item.priceChangePercentage[range];
  const priceAtoms = new BigNumber(item.price).times(
    new BigNumber(10).pow(counterValueUnit.magnitude),
  );

  return {
    id: item.id,
    name: item.name,
    ticker: item.ticker,
    ledgerIds: item.ledgerIds,
    formattedMarketCap:
      item.marketcap == null
        ? "-"
        : counterValueFormatter({
            currency: counterCurrency,
            value: item.marketcap,
            shorten: true,
            locale,
            t,
          }),
    marketcapRank: item.marketcapRank,
    formattedPrice: formatPrice(counterValueUnit, priceAtoms, { locale, showCode: true }),
    priceChangePercentage: Number.isFinite(change) ? change : 0,
  };
}
