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
