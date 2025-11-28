import { makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CurrencyBridge } from "@ledgerhq/types-live";
import { genericGetAccountShape } from "./getAccountShape";
import { getSigner } from "./signer";
import type { AlpacaSigner } from "./signer/types";
import { postSync } from "./postSync";

export function getAlpacaCurrencyBridge(
  network: string,
  kind: string,
  customSigner?: AlpacaSigner,
): CurrencyBridge {
  const signer = customSigner ?? getSigner(network);
  return {
    preload: () => Promise.resolve({}),
    hydrate: () => {
      return;
    },
    scanAccounts: makeScanAccounts({
      getAccountShape: genericGetAccountShape(network, kind),
      getAddressFn: signer.getAddress.bind(signer),
      postSync,
    }),
  };
}
