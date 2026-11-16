type MarketDayChangeMarket = Readonly<{
  priceChangePercentage24h?: number | null;
  currencyId?: string | null;
  ledgerIds?: readonly string[] | null;
}>;

export type MarketDayChangeSource = Readonly<{
  markets?: Readonly<Record<string, MarketDayChangeMarket | null | undefined>>;
  cryptoAssets?: Readonly<
    Record<string, { readonly assetsIds?: Readonly<Record<string, string>> } | null | undefined>
  >;
}>;

function dayChangeOf(market: MarketDayChangeMarket): number | undefined {
  const change = market.priceChangePercentage24h;
  return change != null && Number.isFinite(change) ? change : undefined;
}

/** Every id a market can be looked up by: its key, its own ids and its network ledger ids. */
function idsOfMarket(
  key: string,
  market: MarketDayChangeMarket,
  source: MarketDayChangeSource,
): readonly string[] {
  const ledgerIdsByNetwork = Object.values(source.cryptoAssets?.[key]?.assetsIds ?? {});
  const ids = [key, market.currencyId, ...(market.ledgerIds ?? []), ...ledgerIdsByNetwork];
  return ids.filter((id): id is string => Boolean(id));
}

function addSource(map: Map<string, number>, source: MarketDayChangeSource | null | undefined) {
  if (!source?.markets) return;
  for (const [key, market] of Object.entries(source.markets)) {
    const change = market ? dayChangeOf(market) : undefined;
    if (!market || change === undefined) continue;
    for (const id of idsOfMarket(key, market, source)) map.set(id, change);
  }
}

/** 24h price change in percent points, keyed by every id a held currency can have. */
export function marketDayChangeByCurrencyId(
  ...sources: readonly (MarketDayChangeSource | null | undefined)[]
): ReadonlyMap<string, number> {
  const map = new Map<string, number>();
  for (const source of sources) addSource(map, source);
  return map;
}
