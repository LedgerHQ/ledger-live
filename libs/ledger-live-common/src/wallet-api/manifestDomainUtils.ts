import { getDomain } from "tldts";
import type { LiveAppManifest } from "../platform/types";

/**
 * Parses a URL string and returns both hostname and protocol
 */
function parseUrl(url: string): { hostname: string; protocol: string } | null {
  try {
    const urlObj = new URL(url);
    return { hostname: urlObj.hostname, protocol: urlObj.protocol };
  } catch {
    return null;
  }
}

/**
 * Checks if two URLs are on the same base domain and protocol
 * This allows matching across subdomains (e.g., example.com matches subdomain.example.com)
 */
export function isSameDomain(url1: string | undefined, url2: string | undefined): boolean {
  if (!url1 || !url2) return false;

  const parsed1 = parseUrl(url1);
  const parsed2 = parseUrl(url2);

  if (!parsed1 || !parsed2) {
    return false;
  }

  // Use tldts to extract the base domain (handles complex TLDs like .co.uk)
  const domain1 = getDomain(parsed1.hostname, { allowPrivateDomains: true });
  const domain2 = getDomain(parsed2.hostname, { allowPrivateDomains: true });

  if (!domain1 || !domain2) {
    return false;
  }

  return domain1 === domain2 && parsed1.protocol === parsed2.protocol;
}

/**
 * Applies a custom dapp URL to a manifest if it's on the same domain as the original URL
 */
export function applyCustomDappUrl<T extends LiveAppManifest>(
  manifest: T | null | undefined,
  customDappUrl: string | null | undefined,
): T | null | undefined {
  if (!customDappUrl || !manifest) {
    return manifest;
  }

  // Handle manifest with params.dappUrl
  if (
    manifest.params &&
    "dappUrl" in manifest.params &&
    isSameDomain(customDappUrl, manifest.params.dappUrl)
  ) {
    return {
      ...manifest,
      params: {
        ...manifest.params,
        dappUrl: customDappUrl,
      },
    };
  }

  // Handle manifest.dapp case
  if (manifest.dapp && isSameDomain(customDappUrl, String(manifest.url))) {
    return {
      ...manifest,
      url: customDappUrl,
    };
  }

  return manifest;
}

function matchesDomainPattern(
  pattern: string,
  protocol: string,
  origin: string,
  host: string,
): boolean {
  const trimmed = pattern?.trim();
  if (!trimmed) return false;

  // Exact origin match
  if (trimmed === origin) return true;

  // Protocol-only or "protocol://*" style (e.g. "https://", "https://*")
  if (trimmed === `${protocol}//` || trimmed === `${protocol}//*`) return true;

  // Subdomain wildcard: "https://*.example.com" -> match https://app.example.com
  // Use `host` (hostname + optional port) so patterns like "https://*.example.com:8080"
  // are matched correctly and a port mismatch is rejected.
  if (trimmed.startsWith(`${protocol}//*.`)) {
    const suffix = trimmed.slice(protocol.length + 4); // "//*." length = 4
    if (suffix && host.endsWith("." + suffix)) return true;
  }

  return false;
}

/**
 * Checks if a URL is allowed by the manifest's domains array (origin-whitelist semantics).
 * Used on desktop to mirror mobile's originWhitelist={manifest.domains} behavior.
 * - Only allows schemes that appear in domains (e.g. https:, optionally http:).
 * - Rejects javascript:, data:, file:, etc.
 * - Each domain entry is origin-style: "https://*", "https://example.com", "http://".
 * - Supports trailing "*" for "any host" with that protocol.
 *
 * @param url - The URL to check (e.g. navigation target)
 * @param domains - Array of origin patterns from the manifest (e.g. ["https://*"])
 * @returns true if the URL's origin is allowed by at least one pattern
 */
export function isUrlAllowedByManifestDomains(url: string, domains: string[]): boolean {
  if (!domains || domains.length === 0) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // `host` includes the port for non-standard ports (e.g. "localhost:3000"),
  // unlike `hostname` which always strips it. Using `host` here ensures that
  // patterns like "http://localhost:3000" match correctly and that URLs with
  // non-standard ports are not silently matched against port-less patterns.
  const { protocol, host } = parsed;
  const origin = `${protocol}//${host}`;

  // Only allow http: or https:; reject javascript:, data:, file:, etc.
  if (protocol !== "https:" && protocol !== "http:") {
    return false;
  }

  return domains.some(pattern => matchesDomainPattern(pattern, protocol, origin, host));
}
