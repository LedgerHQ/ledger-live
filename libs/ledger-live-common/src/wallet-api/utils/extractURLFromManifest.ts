import { LiveAppManifest } from "../../platform/types";
import { extractDappURLFromManifest } from "./extractDappURLFromManifest";

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
