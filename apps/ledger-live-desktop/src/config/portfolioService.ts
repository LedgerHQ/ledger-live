/**
 * POC, dev only. The Portfolio service sends no CORS headers, so the renderer cannot call it
 * directly. In development the rspack dev server (tools/rspack/devServer.ts) relays this path to
 * `PORTFOLIO_SERVICE_URL`, which makes the call same-origin. No import here: the build tooling
 * reads this file too.
 */
export const PORTFOLIO_PROXY_PATH = "/__portfolio-service";

/** The base URL the renderer must call: the dev proxy, or empty when the service is not configured. */
export function getPortfolioServiceUrl(configuredUrl: string | undefined, origin: string): string {
  const target = configuredUrl?.trim();
  if (!target) return "";
  return `${origin}${PORTFOLIO_PROXY_PATH}`;
}
