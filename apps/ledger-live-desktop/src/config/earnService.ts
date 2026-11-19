const PRODUCTION_URL = "https://earn.api.live.ledger.com";

/** The Earn backend of the build's `.env` file, production without one. Empty turns it off. */
export function getEarnApiBaseUrl(
  configuredUrl: string | undefined = process.env.EARN_API_BASE_URL,
): string {
  return (configuredUrl ?? PRODUCTION_URL).trim();
}
