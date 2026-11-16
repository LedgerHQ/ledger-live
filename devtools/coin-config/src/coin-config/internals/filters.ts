import type { KeyFilter } from "../../types";

export const COIN_CONFIG_KEY_PREFIX = "config_currency_";

export const FILTERS: readonly KeyFilter[] = ["coins", "all", "overridden"];

export const FILTER_LABELS: Record<KeyFilter, string> = {
  coins: "Coins",
  all: "All",
  overridden: "Overridden",
};

const FILTER_SET: ReadonlySet<string> = new Set(FILTERS);

export const isKeyFilter = (value: string): value is KeyFilter => FILTER_SET.has(value);

export function matchesFilter(
  filter: KeyFilter,
  key: string,
  overrides: Readonly<Record<string, unknown>>,
): boolean {
  switch (filter) {
    case "coins":
      return key.startsWith(COIN_CONFIG_KEY_PREFIX);
    case "overridden":
      return Object.hasOwn(overrides, key);
    case "all":
      return true;
  }
}

export function matchesSearch(key: string, search: string): boolean {
  const query = search.trim().toLowerCase();
  return !query || key.toLowerCase().includes(query);
}
