import { log } from "@ledgerhq/logs";

const ALLOWED_DOMAINS = ["ledger.com"];

const ALLOWED_PROTOCOLS = new Set(["https:", "ledgerlive:", "ledgerwallet:"]);

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
