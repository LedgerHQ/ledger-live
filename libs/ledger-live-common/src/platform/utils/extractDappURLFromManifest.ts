import { LiveAppManifest } from "../types";

export function extractDappURLFromManifest(
  manifest: LiveAppManifest
): URL | undefined {
  if (manifest && manifest.params && "dappUrl" in manifest.params) {
    try {
      const url = new URL(manifest.params.dappUrl);
      return url;
    } catch (error) {
      // Invalid URL
      return undefined;
    }
  }
  return undefined;
}
