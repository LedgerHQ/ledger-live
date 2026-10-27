import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountPortfolioApi,
  type BalancePage,
  type Portfolio,
  type PortfolioRegistration,
} from "@domain/api-account-portfolio";
import type { PortfolioId } from "@domain/entity-client-identity";
import { PortfolioServiceError } from "./errors";

export type PortfolioDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export type BalanceReadParams = { account?: string; size: number; token?: string };

/** The service calls the source makes, each a real call, never served from the RTK Query cache. */
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

const QUERY = { forceRefetch: true, subscribe: false } as const;
const MUTATION = { track: false } as const;
const { endpoints } = accountPortfolioApi;

const statusOf = (error: unknown): unknown =>
  typeof error === "object" && error !== null && "status" in error ? error.status : undefined;

/** RTK Query rejects with a plain object: the router and the slices want an `Error`. */
async function called<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw PortfolioServiceError.from(error);
  }
}

/** The one place the portfolio id leaves its redacted wrapper: the request to the service. */
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
        throw PortfolioServiceError.from(error);
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
