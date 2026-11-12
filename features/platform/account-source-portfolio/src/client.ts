import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountPortfolioApi,
  type BalanceHistoryPage,
  type BalancePage,
  type BalanceRange,
  type Portfolio,
  type PortfolioRegistration,
  type UpdatesPage,
} from "@domain/api-account-portfolio";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import type { PortfolioId } from "@domain/entity-client-identity";
import type { TokenCurrency } from "@domain/entity-currency-token";

export type PortfolioDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export type BalanceReadParams = { account?: string; size: number; token?: string };

export type BalanceHistoryReadParams = {
  account: string;
  range: BalanceRange;
  size: number;
  token?: string;
};

export type UpdatesReadParams = {
  account: string;
  size: number;
  token?: string;
  /** The service's asset: `native`, or a token as `<standard>.<contract>`. */
  asset?: string;
  /** The fiat each change's `currency_value` is in, an ISO 4217 code; USD when absent. */
  currency?: string;
};

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
  /** An abort cancels the request. */
  getBalance(
    portfolioId: PortfolioId,
    params: BalanceReadParams,
    signal?: AbortSignal,
  ): Promise<BalancePage>;
  /** Oldest first. An abort cancels the request. */
  getBalanceHistory(
    portfolioId: PortfolioId,
    params: BalanceHistoryReadParams,
    signal?: AbortSignal,
  ): Promise<BalanceHistoryPage>;
  /** Newest first. An abort cancels the request. */
  getUpdates(
    portfolioId: PortfolioId,
    params: UpdatesReadParams,
    signal?: AbortSignal,
  ): Promise<UpdatesPage>;
  /** The CAL token of an id, undefined when CAL does not list it; served from the shared CAL cache. */
  findToken(id: string): Promise<TokenCurrency | undefined>;
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

/** Aborts the request once `signal` does, also when it already has. */
async function untilAborted<T>(
  request: { abort(): void; unwrap(): Promise<T> },
  signal: AbortSignal | undefined,
): Promise<T> {
  const abort = () => request.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  try {
    return await request.unwrap();
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}

export function portfolioClientOf(dispatch: PortfolioDispatch): PortfolioClient {
  return {
    async getPortfolio(portfolioId, signal) {
      const request = dispatch(
        endpoints.getPortfolio.initiate({ portfolioId: idOf(portfolioId) }, QUERY),
      );
      try {
        return await untilAborted(request, signal);
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
    getBalance: (portfolioId, params, signal) =>
      called(() =>
        untilAborted(
          dispatch(
            endpoints.getBalance.initiate({ portfolioId: idOf(portfolioId), ...params }, QUERY),
          ),
          signal,
        ),
      ),
    getBalanceHistory: (portfolioId, params, signal) =>
      called(() =>
        untilAborted(
          dispatch(
            endpoints.getBalanceHistory.initiate(
              { portfolioId: idOf(portfolioId), order: "ASC", ...params },
              QUERY,
            ),
          ),
          signal,
        ),
      ),
    getUpdates: (portfolioId, params, signal) =>
      called(() =>
        untilAborted(
          dispatch(
            endpoints.getUpdates.initiate(
              { portfolioId: idOf(portfolioId), order: "DESC", ...params },
              QUERY,
            ),
          ),
          signal,
        ),
      ),
    findToken: id =>
      called(() =>
        dispatch(
          cryptoAssetsApi.endpoints.findTokenById.initiate({ id }, { subscribe: false }),
        ).unwrap(),
      ),
  };
}
