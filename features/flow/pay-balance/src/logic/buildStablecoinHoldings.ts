import type { StablecoinItem } from "./buildBalanceFilterOptions";

export type HeldAccount = Readonly<{
  type: string;
  balance: number;
  currency: StablecoinItem["currency"];
}>;

export type BuildStablecoinHoldingsParams = Readonly<{
  catalog: readonly StablecoinItem[];
  heldAccounts: readonly HeldAccount[];
  blacklistedTokenIds: readonly string[] | null | undefined;
  stablecoinTickers: ReadonlySet<string>;
  isLoadingStablecoinTickers: boolean;
}>;

/**
 * Builds the Pay holdings list.
 * Uses DADA catalog rows when any exist. Otherwise maps held accounts.
 */
export function buildStablecoinHoldings({
  catalog,
  heldAccounts,
  blacklistedTokenIds,
  stablecoinTickers,
  isLoadingStablecoinTickers,
}: BuildStablecoinHoldingsParams): StablecoinItem[] {
  const blacklist = new Set(blacklistedTokenIds ?? []);
  const catalogRows = catalog.filter(
    row => !blacklist.has(row.currency.id) && (row.balance > 0 || row.value > 0),
  );
  // Catalog classified at least one funded holding. That list is the source of truth.
  if (catalogRows.length > 0) return catalogRows;

  // Catalog empty: still loading or failed. Infer from accounts.
  return heldAccounts.flatMap(account =>
    toHeldStablecoinRow(account, blacklist, stablecoinTickers, isLoadingStablecoinTickers),
  );
}

function toHeldStablecoinRow(
  account: HeldAccount,
  blacklist: Set<string>,
  stablecoinTickers: ReadonlySet<string>,
  isLoadingStablecoinTickers: boolean,
): StablecoinItem[] {
  // No positive amount. $0 USDC is empty chrome, not funded.
  if (account.balance <= 0) return [];

  const tickersKnown = stablecoinTickers.size > 0;
  // USDC is a TokenAccount. Native ETH/BTC are not. Keep natives out while tickers load.
  const isLoadingToken = isLoadingStablecoinTickers && account.type === "TokenAccount";
  // Tickers unknown and this is not a loading token: skip. UNI also matches TokenAccount
  // here, so it looks funded until tickers arrive (follow-up of LIVE-36422).
  if (!tickersKnown && !isLoadingToken) return [];

  // User hid this token.
  if (blacklist.has(account.currency.id)) return [];
  // Tickers arrived. Drop holdings whose ticker is not a stablecoin.
  if (tickersKnown && !stablecoinTickers.has(account.currency.ticker.toUpperCase())) return [];

  // Countervalue unknown on this path. hasBalance reads balance, not value.
  return [{ currency: account.currency, balance: account.balance, value: 0 }];
}
