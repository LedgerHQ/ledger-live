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
  /** USD → counter-value spot rate (DADA prices are in USD). `null` while it resolves. */
  usdToFiatRate: number | null;
  locale: string;
  t: TFunction;
};

export function mapDadaMarketToDisplayData(
  meta: AssetMeta,
  market: PartialMarketItemResponse | undefined,
  { counterCurrency, counterValueUnit, usdToFiatRate, locale, t }: MapOptions,
): MarketAssetDisplayData {
  const change = market?.priceChangePercentage24h;
  const priceChangePercentage = typeof change === "number" && Number.isFinite(change) ? change : 0;

  const marketCap =
    usdToFiatRate != null && market?.marketCap != null ? market.marketCap * usdToFiatRate : null;
  const priceAtoms =
    usdToFiatRate == null
      ? null
      : new BigNumber(market?.price ?? 0)
          .times(usdToFiatRate)
          .times(new BigNumber(10).pow(counterValueUnit.magnitude));

  return {
    id: dadaIdToMarketId(market?.id ?? meta.id),
    name: market?.name ?? meta.name,
    ticker: (market?.ticker ?? meta.ticker).toUpperCase(),
    ledgerIds: market?.ledgerIds?.length ? market.ledgerIds : [meta.ledgerId],
    formattedMarketCap:
      marketCap == null
        ? "-"
        : counterValueFormatter({
            currency: counterCurrency,
            value: marketCap,
            shorten: true,
            locale,
            t,
          }),
    marketcapRank: market?.marketCapRank ?? 0,
    formattedPrice:
      priceAtoms == null
        ? "-"
        : formatPrice(counterValueUnit, priceAtoms, { locale, showCode: true }),
    priceChangePercentage,
  };
}
