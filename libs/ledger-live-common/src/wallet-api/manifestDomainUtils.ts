import type { LiveAppManifest } from "../platform/types";

/**
 * Extracts the domain from a URL string
 */
export function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Extracts the protocol from a URL string
 */
export function getProtocol(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol;
  } catch {
    return null;
  }
}

/**
 * Checks if two URLs are on the same domain and protocol
 */
export function isSameDomain(url1: string | undefined, url2: string | undefined): boolean {
  if (!url1 || !url2) return false;
  const domain1 = getDomain(url1);
  const domain2 = getDomain(url2);
  const protocol1 = getProtocol(url1);
  const protocol2 = getProtocol(url2);
  return (
    domain1 !== null &&
    domain2 !== null &&
    protocol1 !== null &&
    protocol2 !== null &&
    domain1 === domain2 &&
    protocol1 === protocol2
  );
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
