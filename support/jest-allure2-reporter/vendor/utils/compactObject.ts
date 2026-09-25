export function compactObject<V>(
  object: Record<string, V | undefined | null>,
  excludeNulls: true,
): Record<string, V>;
export function compactObject<V>(
  object: Record<string, V | undefined>,
  excludeNulls?: false,
): Record<string, V>;
export function compactObject<V>(
  object: Record<string, V | undefined>,
  excludeNulls = false,
): Record<string, V> {
  const predicate = excludeNulls ? isNullish : isUndefined;
  return Object.entries(object).reduce((result: Record<string, V>, [key, value]) => {
    if (!predicate(value)) {
      result[key] = value;
    }
    return result;
  }, {});
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}
