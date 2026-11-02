const STAGING_URL = "https://portfolio-service.api.ledger-test.com";

/** Development builds only: staging by default, an empty `PORTFOLIO_SERVICE_URL` turns it off. */
export function getPortfolioServiceUrl(
  configuredUrl: string | undefined = process.env.PORTFOLIO_SERVICE_URL,
  isDevelopment = process.env.NODE_ENV === "development",
): string {
  if (!isDevelopment) return "";
  return (configuredUrl ?? STAGING_URL).trim();
}
