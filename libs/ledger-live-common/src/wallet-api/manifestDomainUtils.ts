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
