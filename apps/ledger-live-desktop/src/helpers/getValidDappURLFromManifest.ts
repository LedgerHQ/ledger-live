import { Manifest } from "~/types/manifest";

export function getValidDappURLFromManifest(manifest: Manifest): URL | undefined {
  if (manifest && manifest.params && manifest.params.dappUrl) {
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
