import type { PortfolioErrorType } from "./types";

const STATUS: Record<PortfolioErrorType, number> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  UNAVAILABLE: 503,
};

/** An error of the portfolio API, with the status and type the service answers. */
export class PortfolioApiError extends Error {
  readonly status: number;
  readonly type: PortfolioErrorType;
  readonly details: string | undefined;

  constructor(type: PortfolioErrorType, message: string, details?: string) {
    super(message);
    this.name = "PortfolioApiError";
    this.type = type;
    this.status = STATUS[type];
    this.details = details;
  }
}

export const isPortfolioApiError = (error: unknown): error is PortfolioApiError =>
  error instanceof PortfolioApiError;
