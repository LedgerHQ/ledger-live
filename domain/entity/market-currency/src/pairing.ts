/** The fields a market needs to be paired with the ledger ids it answers for. */
export type MarketWithLedgerIds = {
  id: string;
  ledgerIds: string[];
};

export type RequestedLedgerMarket<TMarket extends MarketWithLedgerIds> = {
  ledgerId: string;
  market: TMarket;
};

/** A market answers for a ledger id when it lists it, and its own id wins over a shared row. */
function marketForRequestedLedgerId<TMarket extends MarketWithLedgerIds>(
  markets: TMarket[],
  ledgerId: string,
): TMarket | undefined {
  let fallback: TMarket | undefined;
  for (const market of markets) {
    if (!market.ledgerIds.includes(ledgerId)) continue;
    if (market.id === ledgerId) return market;
    fallback ??= market;
  }
  return fallback;
}

/**
 * Pairs each requested ledger id with its market, in request order. Ledger ids that match no market
 * are dropped.
 */
export function pairMarketsWithRequestedLedgerIds<TMarket extends MarketWithLedgerIds>(
  markets: TMarket[],
  ledgerIds: string[],
): RequestedLedgerMarket<TMarket>[] {
  return ledgerIds.flatMap(ledgerId => {
    const market = marketForRequestedLedgerId(markets, ledgerId);
    return market ? [{ ledgerId, market }] : [];
  });
}
