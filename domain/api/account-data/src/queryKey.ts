/** Key order is not meaning: `{ cursor, limit }` and `{ limit, cursor }` ask the same question. */
export function accountDataQueryKey(query: unknown): string {
  if (query === undefined) return "";
  return JSON.stringify(query, (_key, nested: unknown) =>
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? Object.fromEntries(
          Object.entries(nested).sort(([a], [b]) => {
            if (a < b) return -1;
            return a > b ? 1 : 0;
          }),
        )
      : nested,
  );
}
