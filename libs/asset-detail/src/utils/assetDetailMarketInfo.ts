import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import type { AssetDetailMarketInfo } from "../types";

function toAssetDetailMarketInfo(
  source: MarketCurrencyData | undefined,
): AssetDetailMarketInfo | undefined {
  if (!source) return undefined;

  const ledgerIds = source.ledgerIds ?? [];
  const marketInfo: AssetDetailMarketInfo = {
    id: source.id ?? ledgerIds[0],
    ledgerIds,
    name: source.name,
    ticker: source.ticker,
    price: source.price,
  };

  return marketInfo.id ||
    marketInfo.name ||
    marketInfo.ticker ||
    marketInfo.price != null ||
    marketInfo.ledgerIds.length > 0
    ? marketInfo
    : undefined;
}

export function resolveAssetDetailMarketInfo(
  ...sources: Array<MarketCurrencyData | undefined>
): AssetDetailMarketInfo | undefined {
  return sources
    .map(toAssetDetailMarketInfo)
    .find((marketInfo): marketInfo is AssetDetailMarketInfo => marketInfo !== undefined);
}

export function isMarketCurrencyData(value: unknown): value is MarketCurrencyData {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "ledgerIds" in value &&
    Array.isArray(value.ledgerIds)
  );
}
