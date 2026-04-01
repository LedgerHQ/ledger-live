import { log } from "@ledgerhq/logs";

/** Allowlisted host suffixes for HTTPS URLs (e.g. `www.ledger.com`, `support.ledger.com`). */
const ALLOWED_DOMAINS = ["ledger.com"];

/** Allowlisted URL schemes for Wallet API / Live App outbound links. */
const ALLOWED_PROTOCOLS = new Set(["https:", "ledgerlive:", "ledgerwallet:"]);

/**
 * Validates a URL against an allowlist of internal Ledger protocols and domains.
 * Returns the original URL string when valid, or `""` on failure.
 *
 * Rejection reasons are emitted via `@ledgerhq/logs` (type `validateUrl`) so host apps can forward them.
 */
export function validateUrl(urlString: string): string {
  if (!urlString || typeof urlString !== "string") {
    return "";
  }

  try {
    const url = new URL(urlString);

    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
      log("validateUrl", "blocked URL with disallowed protocol", {
        reason: "invalid_protocol",
        protocol: url.protocol,
      });
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
      log("validateUrl", "blocked URL with untrusted domain", {
        reason: "untrusted_domain",
        hostname,
      });
      return "";
    }

    return urlString;
  } catch (error) {
    log("validateUrl", "blocked malformed URL", {
      reason: "invalid_url_format",
      error: String(error),
    });
    return "";
  }
}
