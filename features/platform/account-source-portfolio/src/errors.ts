/** A call to the Portfolio service failed: its HTTP status, never the body, which may hold addresses. */
export class PortfolioServiceError extends Error {
  override name = "PortfolioServiceError";
  readonly status: unknown;
  constructor(message: string, status?: unknown) {
    super(message);
    this.status = status;
  }

  static from(error: unknown): PortfolioServiceError {
    if (error instanceof PortfolioServiceError) return error;
    if (error instanceof Error) return new PortfolioServiceError(error.message);
    if (typeof error !== "object" || error === null) {
      return new PortfolioServiceError(String(error));
    }
    const status = "status" in error ? error.status : undefined;
    return new PortfolioServiceError(`Portfolio service call failed: ${String(status)}`, status);
  }
}
