import { makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CurrencyBridge } from "@ledgerhq/types-live";
import { genericGetAccountShape } from "./getAccountShape";
import { getSigner } from "./signer";

export function getAlpacaCurrencyBridge(network: string, kind: string): CurrencyBridge {
  return {
    preload: () => Promise.resolve({}),
    hydrate: () => {
      return;
    },
    scanAccounts: makeScanAccounts({
      getAccountShape: genericGetAccountShape(network, kind),
      getAddressFn: getSigner(network).getAddress,
    }),
  };
}
