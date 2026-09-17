import type { PayCardCurrencyMappingRow } from "../../types";

export function pairFromCatalogKey(key: string): { currency: string; network: string } | null {
  const dot = key.indexOf(".");
  if (dot <= 0 || dot === key.length - 1) {
    return null;
  }

  return { currency: key.slice(0, dot), network: key.slice(dot + 1) };
}

function preferredCatalogKey(keys: readonly string[]): string {
  const namedNetwork = keys.find(key => {
    const pair = pairFromCatalogKey(key);
    return pair !== null && pair.currency !== pair.network;
  });
  return namedNetwork ?? keys[0]!;
}

export function assetSelectItems(catalog: readonly PayCardCurrencyMappingRow[]) {
  const keysByLedgerId = new Map<string, string[]>();

  for (const { key, ledgerId } of catalog) {
    if (!ledgerId || pairFromCatalogKey(key) === null) continue;
    const keys = keysByLedgerId.get(ledgerId) ?? [];
    keys.push(key);
    keysByLedgerId.set(ledgerId, keys);
  }

  return [...keysByLedgerId.values()]
    .map(keys => {
      const key = preferredCatalogKey(keys);
      const pair = pairFromCatalogKey(key);
      return { value: key, label: pair === null ? key : pair.currency.toUpperCase() };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
