export type MarketCurrencyRequestParams = {
  id?: string;
  counterCurrency?: string;
  /** Ledger currency ids to resolve via the `/v3/markets` `ledgerIds` filter. */
  ledgerIds?: string[];
};

export type MarketsByLedgerIdsQueryParams = {
  ledgerIds: string[];
  counterCurrency: string;
};
