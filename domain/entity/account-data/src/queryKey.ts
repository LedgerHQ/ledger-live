/** Where a query is stored: field order and unset fields are not meaning, `{}` is no query. */
export function accountDataQueryKey(query: unknown): string {
  if (query === undefined) return "";
  const key = JSON.stringify(query, (_key, nested: unknown) =>
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? Object.fromEntries(
          Object.entries(nested).sort(([a], [b]) => {
            if (a < b) return -1;
            return a > b ? 1 : 0;
          }),
        )
      : nested,
  );
  return key === "{}" ? "" : key;
}
