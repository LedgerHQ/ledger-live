import { extractDappURLFromManifest } from "./extractDappURLFromManifest";
import { LiveAppManifest } from "../types";

/** Returns dapp dappURL or live app URL from manifest. */
export function extractURLFromManifest(manifest: LiveAppManifest): URL | undefined {
  if (!manifest) {
    return undefined;
  }

  const dappUrl = extractDappURLFromManifest(manifest);

  if (dappUrl) {
    return dappUrl;
  }

  try {
    if (manifest.url && manifest.url instanceof URL) {
      return manifest.url;
    }
    const url = new URL(manifest.url);
    return url;
  } catch (error) {
    // Invalid URL
    return undefined;
  }
}
