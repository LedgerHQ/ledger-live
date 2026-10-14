import { PortfolioApiError, isPortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type { Portfolio } from "@ledgerhq/portfolio-module-framework";
import { SIDES } from "./sides";
import type { Side } from "./types";

/** Each side's portfolio, `undefined` where that side does not know it. */
export type SidePortfolios = Record<Side, Portfolio | undefined>;

export const portfolioNotFound = (portfolioId: string): PortfolioApiError =>
  new PortfolioApiError("NOT_FOUND", `Portfolio ${portfolioId} not found`);

export async function orNotFound<T>(request: Promise<T>): Promise<T | undefined> {
  try {
    return await request;
  } catch (error) {
    if (isPortfolioApiError(error) && error.type === "NOT_FOUND") return undefined;
    throw error;
  }
}

export function mergePortfolios(portfolioId: string, portfolios: SidePortfolios): Portfolio {
  const found = SIDES.flatMap(side => portfolios[side] ?? []);
  if (found.length === 0) throw portfolioNotFound(portfolioId);
  return {
    id: portfolioId,
    registrations: found.flatMap(portfolio => portfolio.registrations ?? []),
    accounts: found.flatMap(portfolio => portfolio.accounts ?? []),
  };
}

export const ownsRegistration = (portfolio: Portfolio | undefined, registrationId: string) =>
  portfolio?.registrations?.some(registration => registration.id === registrationId) === true;

export const ownsAccount = (portfolio: Portfolio | undefined, accountId: string) =>
  portfolio?.accounts?.some(account => account.id === accountId) === true;
