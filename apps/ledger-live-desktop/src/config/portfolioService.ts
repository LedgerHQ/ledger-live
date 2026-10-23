/**
 * POC, dev only. The Portfolio service sends no CORS headers, so the renderer cannot call it
 * directly. In development the rspack dev server (tools/rspack/devServer.ts) relays this path to
 * `PORTFOLIO_SERVICE_URL`, which makes the call same-origin. No import here: the build tooling
 * reads this file too.
 */
export const PORTFOLIO_PROXY_PATH = "/__portfolio-service";

/**
 * The base URL the renderer must call: the dev proxy, or empty when the service is not configured
 * or the app is not served by the dev server, which is the only place the proxy exists.
 */
export function getPortfolioServiceUrl(
  configuredUrl: string | undefined,
  origin: string,
  isDevelopment = process.env.NODE_ENV === "development",
): string {
  const target = configuredUrl?.trim();
  if (!isDevelopment || !target) return "";
  return `${origin}${PORTFOLIO_PROXY_PATH}`;
}
