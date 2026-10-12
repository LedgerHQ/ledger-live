import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";

/** Cap ledger ids in the query string to keep /v3/markets URLs within safe length. */
export const MAX_MARKET_LEDGER_IDS = 10;

export function isCoingeckoStyleMarketId(id: string): boolean {
  return !id.includes("/") && !id.includes(":");
}

/** Resolves an `ids` query value when the market API supports the legacy filter. */
export function resolveCoingeckoIdForIdsQuery(marketApiId: string | undefined): string | undefined {
  if (!marketApiId) return undefined;
  if (isCoingeckoStyleMarketId(marketApiId)) return marketApiId;
  const converted = dadaIdToMarketId(marketApiId);
  return isCoingeckoStyleMarketId(converted) ? converted : undefined;
}

export function getMarketLedgerIdsForQuery(knownLedgerIds: readonly string[]): string[] {
  return [...knownLedgerIds].slice(0, MAX_MARKET_LEDGER_IDS);
}

export type MarketCurrencyQueryArgs = Readonly<{
  id?: string;
  ledgerIds?: string[];
  counterCurrency: string;
}>;

export function buildMarketCurrencyQueryArgs({
  marketApiId,
  knownLedgerIds,
  counterCurrency,
}: {
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  counterCurrency: string;
}): { args: MarketCurrencyQueryArgs; skip: boolean } {
  if (knownLedgerIds?.length) {
    return {
      args: { ledgerIds: getMarketLedgerIdsForQuery(knownLedgerIds), counterCurrency },
      skip: false,
    };
  }

  const idsQueryId = resolveCoingeckoIdForIdsQuery(marketApiId);
  return {
    args: { id: idsQueryId ?? marketApiId ?? "", counterCurrency },
    skip: !idsQueryId && !marketApiId,
  };
}
