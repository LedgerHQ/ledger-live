export function stringifyValues<T extends Record<string, unknown>>(
  values: T,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).reduce(
      (accumulator, [key, value]) =>
        value == null ? accumulator : [...accumulator, [key, String(value)]],
      [] as [string, string][],
    ),
  );
}
