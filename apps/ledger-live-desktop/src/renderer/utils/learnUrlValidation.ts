import logger from "~/renderer/logger";

const ALLOWED_DOMAINS = ["ledger.com"];
const ALLOWED_PROTOCOLS = ["https:", "ledgerlive:", "ledgerwallet:"];

/**
 * Validates a URL against an allowlist of internal Ledger protocols and domains.
 * Returns the original URL string when valid, or `""` on failure.
 */
export function validateUrl(urlString: string): string {
  if (!urlString || typeof urlString !== "string") {
    return "";
  }

  try {
    const url = new URL(urlString);

    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      logger.warn(`learnUrlValidation: blocked URL with protocol ${url.protocol}`);
      return "";
    }

    if (url.protocol === "ledgerlive:" || url.protocol === "ledgerwallet:") {
      return urlString;
    }

    const hostname = url.hostname.toLowerCase();
    const isAllowedDomain = ALLOWED_DOMAINS.some(
      domain => hostname === domain || hostname.endsWith("." + domain),
    );

    if (!isAllowedDomain) {
      logger.warn(`learnUrlValidation: blocked URL with untrusted domain ${hostname}`);
      return "";
    }

    return urlString;
  } catch {
    logger.warn(`learnUrlValidation: blocked malformed URL`);
    return "";
  }
}
