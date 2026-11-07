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
