export function getErrorName(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const name = (error as { name?: unknown }).name;
  return typeof name === "string" ? name : undefined;
}

/** Keeps the original `name`, since the failure mapping and the logs both read it. */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);

  const message = (error as { message?: unknown } | null)?.message;
  const mapped = new Error(
    typeof message === "string" ? message : "Ledger Sync device call failed",
  );
  const name = getErrorName(error);
  if (name) mapped.name = name;
  return mapped;
}
