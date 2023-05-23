import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export function getValidDappURLFromManifest(manifest: LiveAppManifest): URL | undefined {
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
