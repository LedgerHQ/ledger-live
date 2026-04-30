import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import { genericGetAccountShape } from "./getAccountShape";
import { getSigner } from "./signer";
import type { AlpacaSigner } from "./types";
import { postSync } from "./postSync";

export async function getAlpacaCurrencyBridge(
  network: string,
  kind: string,
  customSigner?: AlpacaSigner,
): Promise<CurrencyBridge> {
  const signer = customSigner ?? (await getSigner(network));
  return {
    preload: () => Promise.resolve({}),
    hydrate: () => undefined,
    scanAccounts: makeScanAccounts({
      getAccountShape: genericGetAccountShape(network, kind),
      getAddressFn: signer.getAddress.bind(signer),
      postSync,
    }),
  };
}
