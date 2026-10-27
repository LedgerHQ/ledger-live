/**
 * POC, dev only. The renderer calls `getEnv("PORTFOLIO_SERVICE_URL")` directly. Empty when that
 * value is empty or this is not a development build.
 */
export function getPortfolioServiceUrl(
  configuredUrl: string | undefined,
  isDevelopment = process.env.NODE_ENV === "development",
): string {
  const target = configuredUrl?.trim();
  if (!isDevelopment || !target) return "";
  return target;
}
