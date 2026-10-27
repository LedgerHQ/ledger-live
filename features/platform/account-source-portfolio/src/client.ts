import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountPortfolioApi,
  type BalancePage,
  type Portfolio,
  type PortfolioRegistration,
} from "@domain/api-account-portfolio";
import type { PortfolioId } from "@domain/entity-client-identity";

export type PortfolioDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export type BalanceReadParams = { account?: string; size: number; token?: string };

/** The Portfolio service calls, each a real call, never served from the RTK Query cache. */
export type PortfolioClient = {
  /** Undefined when the service does not know the portfolio. */
  getPortfolio(portfolioId: PortfolioId): Promise<Portfolio | undefined>;
  createPortfolio(portfolioId: PortfolioId): Promise<Portfolio>;
  addRegistrations(
    portfolioId: PortfolioId,
    registrations: PortfolioRegistration[],
  ): Promise<Portfolio>;
  removeRegistrations(portfolioId: PortfolioId, registrationIds: string[]): Promise<Portfolio>;
  getBalance(portfolioId: PortfolioId, params: BalanceReadParams): Promise<BalancePage>;
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

const statusOf = (error: unknown): unknown =>
  typeof error === "object" && error !== null && "status" in error ? error.status : undefined;

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
    async getPortfolio(portfolioId) {
      try {
        return await dispatch(
          endpoints.getPortfolio.initiate({ portfolioId: idOf(portfolioId) }, QUERY),
        ).unwrap();
      } catch (error) {
        if (statusOf(error) === 404) return undefined;
        throw toError(error);
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
    getBalance: (portfolioId, params) =>
      called(() =>
        dispatch(
          endpoints.getBalance.initiate({ portfolioId: idOf(portfolioId), ...params }, QUERY),
        ).unwrap(),
      ),
  };
}
