import { getDomain } from "tldts";
import type { LiveAppManifest } from "../platform/types";
import { isUrlAllowedByManifestDomains } from "@features/platform-wallet-api-server";

/**
 * Parses a URL string and returns hostname, host (incl. port), and protocol.
 */
function parseUrl(url: string): { hostname: string; host: string; protocol: string } | null {
  try {
    const urlObj = new URL(url);
    return { hostname: urlObj.hostname, host: urlObj.host, protocol: urlObj.protocol };
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

  // tldts returns null for hostnames that don't map to a public suffix — localhost,
  // bare IPs, `.local` mDNS, internal dev hostnames. Fall back to strict same-origin
  // equality (host = hostname + port + protocol) so dev setups still match while
  // preventing cross-port pivots like localhost:3000 → localhost:8080.
  if (!domain1 || !domain2) {
    return (
      parsed1.host.toLowerCase() === parsed2.host.toLowerCase() &&
      parsed1.protocol === parsed2.protocol
    );
  }

  return domain1 === domain2 && parsed1.protocol === parsed2.protocol;
}

export type ApplyCustomDappUrlOptions = {
  /** Also require the custom URL's origin to be listed in the manifest's `domains` */
  enforceManifestDomains?: boolean;
};

/**
 * A custom URL may replace a manifest URL only if it stays on the same base domain
 * and, when the manifest domains are enforced, its origin is listed in the manifest's `domains`.
 */
function isCustomDappUrlAllowed(
  customDappUrl: string,
  originalUrl: string | undefined,
  domains: string[] | undefined,
  enforceManifestDomains: boolean,
): boolean {
  return (
    isSameDomain(customDappUrl, originalUrl) &&
    (!enforceManifestDomains || isUrlAllowedByManifestDomains(customDappUrl, domains ?? []))
  );
}

/**
 * Applies a custom dapp URL to a manifest if it's on the same domain as the original URL
 * and, when the manifest domains are enforced, allowed by the manifest's domains
 */
export function applyCustomDappUrl<T extends LiveAppManifest>(
  manifest: T | null | undefined,
  customDappUrl: string | null | undefined,
  { enforceManifestDomains = false }: ApplyCustomDappUrlOptions = {},
): T | null | undefined {
  if (!customDappUrl || !manifest) {
    return manifest;
  }

  // Handle manifest with params.dappUrl
  if (
    manifest.params &&
    "dappUrl" in manifest.params &&
    isCustomDappUrlAllowed(
      customDappUrl,
      manifest.params.dappUrl,
      manifest.domains,
      enforceManifestDomains,
    )
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
  if (
    manifest.dapp &&
    isCustomDappUrlAllowed(
      customDappUrl,
      String(manifest.url),
      manifest.domains,
      enforceManifestDomains,
    )
  ) {
    return {
      ...manifest,
      url: customDappUrl,
    };
  }

  return manifest;
}

export { isUrlAllowedByManifestDomains };
