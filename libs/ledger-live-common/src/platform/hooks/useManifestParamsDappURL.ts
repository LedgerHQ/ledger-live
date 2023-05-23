import { useMemo } from "react";

import { LiveAppManifest } from "../types";

export function useManifestParamsDappURL(
  manifest: LiveAppManifest
): URL | undefined {
  const dappURL = useMemo(() => {
    if (manifest && manifest.params && "dappUrl" in manifest.params) {
      try {
        const url = new URL(manifest.params.dappUrl);
        return url;
      } catch (error) {
        return undefined;
      }
    }
    return undefined;
  }, [manifest]);

  return dappURL;
}
