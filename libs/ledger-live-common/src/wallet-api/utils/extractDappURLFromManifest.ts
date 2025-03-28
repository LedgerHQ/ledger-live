import { LiveAppManifest } from "../types";

export function extractDappURLFromManifest(manifest: LiveAppManifest): URL | undefined {
  if (manifest && manifest.params && "dappUrl" in manifest.params) {
    try {
      const url = new URL(manifest.params.dappUrl);
      return url;
    } catch (error) {
      // Invalid URL
      return undefined;
    }
  }
  if (
    manifest &&
    manifest.params &&
    "dappURL" in manifest.params &&
    typeof manifest.params.dappURL === "string"
  ) {
    try {
      const url = new URL(manifest.params.dappURL);
      return url;
    } catch (error) {
      // Invalid URL
      return undefined;
    }
  }
  if (manifest && manifest.dapp) {
    try {
      if (manifest.url instanceof URL) {
        return manifest.url;
      }
      const url = new URL(manifest.url);
      return url;
    } catch (error) {
      // Invalid URL
      return undefined;
    }
  }
  return undefined;
}
