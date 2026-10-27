import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountPortfolioApi,
  type BalancePage,
  type Portfolio,
  type PortfolioReadParams,
  type PortfolioRegistration,
} from "@domain/api-account-portfolio";
import { PortfolioServiceError } from "./errors";

export type PortfolioDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

/** The service calls the source makes, each a real call, never served from the RTK Query cache. */
export type PortfolioClient = {
  /** Undefined when the service does not know the portfolio. */
  getPortfolio(portfolioId: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolioId: string): Promise<Portfolio>;
  addRegistrations(portfolioId: string, registrations: PortfolioRegistration[]): Promise<Portfolio>;
  removeRegistrations(portfolioId: string, registrationIds: string[]): Promise<Portfolio>;
  getBalance(params: PortfolioReadParams): Promise<BalancePage>;
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

export function portfolioClientOf(dispatch: PortfolioDispatch): PortfolioClient {
  return {
    async getPortfolio(portfolioId) {
      try {
        return await dispatch(endpoints.getPortfolio.initiate({ portfolioId }, QUERY)).unwrap();
      } catch (error) {
        if (statusOf(error) === 404) return undefined;
        throw PortfolioServiceError.from(error);
      }
    },
    createPortfolio: portfolioId =>
      called(() =>
        dispatch(endpoints.createPortfolio.initiate({ portfolioId }, MUTATION)).unwrap(),
      ),
    addRegistrations: (portfolioId, registrations) =>
      called(() =>
        dispatch(
          endpoints.addRegistrations.initiate({ portfolioId, registrations }, MUTATION),
        ).unwrap(),
      ),
    removeRegistrations: (portfolioId, registrationIds) =>
      called(() =>
        dispatch(
          endpoints.removeRegistrations.initiate({ portfolioId, registrationIds }, MUTATION),
        ).unwrap(),
      ),
    getBalance: params =>
      called(() => dispatch(endpoints.getBalance.initiate(params, QUERY)).unwrap()),
  };
}
