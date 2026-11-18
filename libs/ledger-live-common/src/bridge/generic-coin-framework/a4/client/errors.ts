export class A4HttpError extends Error {
  override name = "A4HttpError";
  readonly status: number | undefined;

  constructor(message: string, status?: number | undefined) {
    super(message);
    this.status = status;
  }
}

export function toA4HttpError(error: unknown): A4HttpError {
  if (error instanceof A4HttpError) {
    return error;
  }

  if (!(error instanceof Error)) {
    return new A4HttpError("A4 request failed");
  }

  if (error.name !== "LedgerAPI4xx" && error.name !== "LedgerAPI5xx") {
    return new A4HttpError(error.message);
  }

  const status = "status" in error && typeof error.status === "number" ? error.status : undefined;
  return new A4HttpError(error.message, status);
}

/**
 * A4 serves a transaction whose fee is paid in another asset than the native coin. The A4 adapter
 * does not translate such a fee: the sync falls back to the coin module, which reports the fee
 * asset in a form the family resolves.
 */
export class A4NonNativeFeeError extends Error {
  override name = "A4NonNativeFeeError";
}
