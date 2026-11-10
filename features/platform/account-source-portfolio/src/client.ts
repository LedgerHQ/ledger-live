import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountPortfolioApi,
  type Portfolio,
  type PortfolioRegistration,
} from "@domain/api-account-portfolio";
import type { PortfolioId } from "@domain/entity-client-identity";

export type PortfolioDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

/** The Portfolio service calls, each a real call, never served from the RTK Query cache. */
export type PortfolioClient = {
  /** Undefined when the service does not know the portfolio; an abort cancels the request. */
  getPortfolio(portfolioId: PortfolioId, signal?: AbortSignal): Promise<Portfolio | undefined>;
  createPortfolio(portfolioId: PortfolioId): Promise<Portfolio>;
  addRegistrations(
    portfolioId: PortfolioId,
    registrations: PortfolioRegistration[],
  ): Promise<Portfolio>;
  removeRegistrations(portfolioId: PortfolioId, registrationIds: string[]): Promise<Portfolio>;
};

/** A failed service call: its HTTP status only, never the body, which may hold addresses. */
export class PortfolioServiceError extends Error {
  override name = "PortfolioServiceError";
  readonly status: unknown;
  constructor(status: unknown) {
    super(`Portfolio service call failed: ${String(status)}`);
    this.status = status;
  }
}

const QUERY = { forceRefetch: true, subscribe: false } as const;
const MUTATION = { track: false } as const;
const { endpoints } = accountPortfolioApi;

/** The HTTP status, also of a response `fetchBaseQuery` could not parse, such as a non-JSON 404. */
function statusOf(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  if (error.status === "PARSING_ERROR" && "originalStatus" in error) return error.originalStatus;
  return error.status;
}

const toError = (error: unknown) =>
  error instanceof PortfolioServiceError ? error : new PortfolioServiceError(statusOf(error));

async function called<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toError(error);
  }
}

const idOf = (portfolioId: PortfolioId) => portfolioId.exportPortfolioIdForPortfolioService();

export function portfolioClientOf(dispatch: PortfolioDispatch): PortfolioClient {
  return {
    async getPortfolio(portfolioId, signal) {
      const request = dispatch(
        endpoints.getPortfolio.initiate({ portfolioId: idOf(portfolioId) }, QUERY),
      );
      const abort = () => request.abort();
      if (signal?.aborted) abort();
      else signal?.addEventListener("abort", abort, { once: true });
      try {
        return await request.unwrap();
      } catch (error) {
        if (statusOf(error) === 404) return undefined;
        throw toError(error);
      } finally {
        signal?.removeEventListener("abort", abort);
      }
    },
    createPortfolio: portfolioId =>
      called(() =>
        dispatch(
          endpoints.createPortfolio.initiate({ portfolioId: idOf(portfolioId) }, MUTATION),
        ).unwrap(),
      ),
    addRegistrations: (portfolioId, registrations) =>
      called(() =>
        dispatch(
          endpoints.addRegistrations.initiate(
            { portfolioId: idOf(portfolioId), registrations },
            MUTATION,
          ),
        ).unwrap(),
      ),
    removeRegistrations: (portfolioId, registrationIds) =>
      called(() =>
        dispatch(
          endpoints.removeRegistrations.initiate(
            { portfolioId: idOf(portfolioId), registrationIds },
            MUTATION,
          ),
        ).unwrap(),
      ),
  };
}
