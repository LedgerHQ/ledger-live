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

export function buildStablecoinHoldings({
  catalog,
  heldAccounts,
  blacklistedTokenIds,
  stablecoinTickers,
  isLoadingStablecoinTickers,
}: BuildStablecoinHoldingsParams): StablecoinItem[] {
  const blacklist = new Set(blacklistedTokenIds ?? []);
  const catalogRows = catalog.filter(row => !blacklist.has(row.currency.id));
  if (catalogRows.length > 0) return catalogRows;

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
  if (account.balance <= 0) return [];

  const tickersKnown = stablecoinTickers.size > 0;
  const isLoadingToken = isLoadingStablecoinTickers && account.type === "TokenAccount";
  if (!tickersKnown && !isLoadingToken) return [];

  if (blacklist.has(account.currency.id)) return [];
  if (tickersKnown && !stablecoinTickers.has(account.currency.ticker.toUpperCase())) return [];

  return [{ currency: account.currency, balance: account.balance, value: 0 }];
}
