/** A coin-config value that breaks an invariant of its reader, such as a zero TTL or page size. */
export class ConcordiumInvalidConfigError extends Error {
  override name = "ConcordiumInvalidConfigError";
}

function integer(field: string, value: unknown, min: number): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= min) return value;
  throw new ConcordiumInvalidConfigError(
    `concordium: coin config ${field} must be an integer >= ${min}, got ${String(value)}`,
  );
}

/** For a TTL, a page size, a timeout or a concurrency: zero would disable or stall its reader. */
export const positiveInt = (field: string, value: unknown): number => integer(field, value, 1);

export const nonNegativeInt = (field: string, value: unknown): number => integer(field, value, 0);

export function nonEmptyString(field: string, value: unknown): string {
  if (typeof value === "string" && value !== "") return value;
  throw new ConcordiumInvalidConfigError(
    `concordium: coin config ${field} must be a non-empty string, got ${String(value)}`,
  );
}

/** For a feature switch: a remote `"false"` or `1` must not read as on. */
export function boolean(field: string, value: unknown): boolean {
  if (typeof value === "boolean") return value;
  throw new ConcordiumInvalidConfigError(
    `concordium: coin config ${field} must be a boolean, got ${String(value)}`,
  );
}
