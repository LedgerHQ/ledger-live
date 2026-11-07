import type { WalletAPIAccountFilter } from "@features/platform-wallet-api-accounts";

/** The currency patterns of a manifest (`"*"`, `"bitcoin"`, `"ethereum/**"`, a token id). */
export type ManifestCurrencies = string[] | "*";

/** The patterns a request may see: the manifest ones, narrowed to `queryCurrencyIds` when given. */
export function effectiveCurrencyIds(
  manifestCurrencies: ManifestCurrencies,
  queryCurrencyIds?: string[],
): string[] {
  const manifestIds = manifestCurrencies === "*" ? ["**"] : manifestCurrencies;
  if (!queryCurrencyIds) return manifestIds;
  const query = new Set(queryCurrencyIds);
  return manifestIds.flatMap(manifestId => {
    if (manifestId === "**") return [...query];
    if (manifestId.endsWith("/**")) {
      const family = manifestId.slice(0, -3);
      return [...query].filter(id => id.startsWith(`${family}/`));
    }
    return query.has(manifestId) ? [manifestId] : [];
  });
}

/** Whether an account of `currencyId`, on `parentCurrencyId`, matches one of `currencyIds`. */
export function accountFilterOf(currencyIds: string[]): WalletAPIAccountFilter {
  const includeAll = currencyIds.includes("**");
  const allowed = new Set<string>();
  const tokenFamilies = new Set<string>();
  for (const id of currencyIds) {
    if (id === "**") continue;
    if (id.endsWith("/**")) tokenFamilies.add(id.slice(0, -3));
    else allowed.add(id);
  }
  return (currencyId, parentCurrencyId) =>
    includeAll || allowed.has(currencyId) || tokenFamilies.has(parentCurrencyId);
}
