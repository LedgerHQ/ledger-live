export type HeldMarket = Readonly<{
  id: string;
  ticker?: string | null;
  ledgerIds?: readonly string[] | null;
  priceChangePercentage24h?: number | null;
}>;

export type HeldCurrency = Readonly<{ id: string; ticker: string }>;

export type HeldMarketDayChange = Readonly<{
  byLedgerId: ReadonlyMap<string, number>;
  byMarketId: ReadonlyMap<string, number>;
}>;

export const NO_HELD_MARKET_DAY_CHANGE: HeldMarketDayChange = {
  byLedgerId: new Map(),
  byMarketId: new Map(),
};

function dayChangeOf(market: HeldMarket): number | undefined {
  const change = market.priceChangePercentage24h;
  return change != null && Number.isFinite(change) ? change : undefined;
}

function listsLedgerId(market: HeldMarket, ledgerId: string): boolean {
  return market.id === ledgerId || Boolean(market.ledgerIds?.includes(ledgerId));
}

// A network id is listed by its native coin and by the token named after it: Optimism lists ETH and OP
function marketOfHeldCurrency(
  markets: readonly HeldMarket[],
  currency: HeldCurrency,
): HeldMarket | undefined {
  const candidates = markets.filter(market => listsLedgerId(market, currency.id));
  const ticker = currency.ticker.toLowerCase();
  return (
    candidates.find(market => market.ticker?.toLowerCase() === ticker) ??
    candidates.find(market => market.id === currency.id) ??
    candidates[0]
  );
}

/** 24h change in percent points of the markets of held currencies, by ledger id and by market id. */
export function heldMarketDayChange(
  markets: readonly HeldMarket[],
  heldCurrencies: readonly HeldCurrency[],
): HeldMarketDayChange {
  const byMarketId = new Map<string, number>();
  for (const market of markets) {
    const change = dayChangeOf(market);
    if (change !== undefined) byMarketId.set(market.id, change);
  }

  const byLedgerId = new Map<string, number>();
  const heldMarkets: { market: HeldMarket; change: number }[] = [];
  for (const currency of heldCurrencies) {
    const market = marketOfHeldCurrency(markets, currency);
    const change = market ? byMarketId.get(market.id) : undefined;
    if (!market || change === undefined) continue;
    byLedgerId.set(currency.id, change);
    heldMarkets.push({ market, change });
  }

  // Portfolio rows group networks under one asset id: ETH held on Base is listed as `ethereum`
  for (const { market, change } of heldMarkets) {
    for (const ledgerId of market.ledgerIds ?? []) {
      if (!byLedgerId.has(ledgerId)) byLedgerId.set(ledgerId, change);
    }
  }

  return { byLedgerId, byMarketId };
}

/** Held 24h change of an asset page, by its ledger id first, then by its market id. */
export function heldDayChangeOfAsset(
  { byLedgerId, byMarketId }: HeldMarketDayChange,
  ledgerId: string | undefined,
  marketId: string | undefined,
): number | undefined {
  const byLedger = ledgerId == null ? undefined : byLedgerId.get(ledgerId);
  return byLedger ?? (marketId == null ? undefined : byMarketId.get(marketId));
}

/** Replaces the 24h change of each held market item. */
export function withHeldDayChange<
  T extends Readonly<{ id: string; priceChangePercentage24h: number }>,
>(items: T[], byMarketId: ReadonlyMap<string, number>): T[] {
  if (byMarketId.size === 0) return items;
  return items.map(item => {
    const change = byMarketId.get(item.id);
    return change === undefined ? item : { ...item, priceChangePercentage24h: change };
  });
}

/** Countervalue variation of a balance whose price moved by `percentPoints` over the day. */
export function countervalueChangeFromDayPercent(
  currentCountervalue: number | null | undefined,
  percentPoints: number,
): { readonly percentage: number; readonly value: number } | undefined {
  if (
    currentCountervalue == null ||
    !Number.isFinite(currentCountervalue) ||
    !Number.isFinite(percentPoints)
  ) {
    return undefined;
  }

  const denominator = 1 + percentPoints / 100;
  if (denominator === 0) return undefined;

  const value = currentCountervalue - currentCountervalue / denominator;
  if (!Number.isFinite(value)) return undefined;

  return { percentage: percentPoints / 100, value };
}
