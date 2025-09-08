import { IterateResultBuilder, makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { buildIterateResult as hederaBuildIterateResult } from "@ledgerhq/coin-hedera/bridge/synchronisation";
import { CurrencyBridge } from "@ledgerhq/types-live";
import { genericGetAccountShape } from "./getAccountShape";
import { getSigner } from "./signer";
import type { AlpacaSigner } from "./signer/types";

const getBuildIterateResult = (network: string): IterateResultBuilder | undefined => {
  switch (network) {
    case "hedera":
      return hederaBuildIterateResult;
    default:
      return undefined;
  }
};

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
      buildIterateResult: getBuildIterateResult(network),
    }),
  };
}
