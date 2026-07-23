import { useMemo } from "react";
import type { AppManifest } from "../types";

export function useDAppManifestCurrencyIds(manifest: AppManifest) {
  return useMemo(() => {
    return (
      manifest.dapp?.networks.map(network => {
        return network.currency;
      }) ?? []
    );
  }, [manifest.dapp?.networks]);
}
