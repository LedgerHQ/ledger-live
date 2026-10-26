import { getEnv } from "@shared/env";
import { getPortfolioServiceUrl } from "~/config/portfolioService";

/** Development only: the Accounts pages read the Portfolio service when its url is set. */
export function useIsPortfolioServiceEnabled(): boolean {
  return getPortfolioServiceUrl(getEnv("PORTFOLIO_SERVICE_URL")) !== "";
}
