import BigNumber from "bignumber.js";
import type { TFunction } from "i18next";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { PartialMarketItemResponse } from "@ledgerhq/live-common/market/utils/types";
import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";
import { formatPrice } from "@ledgerhq/live-currency-format";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { counterValueFormatter } from "LLM/features/Market/utils";

type AssetMeta = {
  id: string;
  name: string;
  ticker: string;
  /** Resolved ledger currency id, used for the crypto icon when the market omits ledgerIds. */
  ledgerId: string;
};

type MapOptions = {
  counterCurrency: string;
  counterValueUnit: Unit;
  locale: string;
  t: TFunction;
};

export function mapDadaMarketToDisplayData(
  meta: AssetMeta,
  market: PartialMarketItemResponse | undefined,
  { counterCurrency, counterValueUnit, locale, t }: MapOptions,
): MarketAssetDisplayData {
  const change = market?.priceChangePercentage24h;
  const priceChangePercentage = typeof change === "number" && Number.isFinite(change) ? change : 0;
  const priceAtoms = new BigNumber(market?.price ?? 0).times(
    new BigNumber(10).pow(counterValueUnit.magnitude),
  );

  return {
    id: dadaIdToMarketId(market?.id ?? meta.id),
    name: market?.name ?? meta.name,
    ticker: (market?.ticker ?? meta.ticker).toUpperCase(),
    ledgerIds: market?.ledgerIds?.length ? market.ledgerIds : [meta.ledgerId],
    formattedMarketCap:
      market?.marketCap == null
        ? "-"
        : counterValueFormatter({
            currency: counterCurrency,
            value: market.marketCap,
            shorten: true,
            locale,
            t,
          }),
    marketcapRank: market?.marketCapRank ?? 0,
    formattedPrice: formatPrice(counterValueUnit, priceAtoms, { locale, showCode: true }),
    priceChangePercentage,
  };
}
