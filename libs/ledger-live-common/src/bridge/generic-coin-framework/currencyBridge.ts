import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import { getBridgeApi } from "./bridge";
import { genericGetAccountShape } from "./getAccountShape";
import { getSigner } from "./signer";
import type { CoinFrameworkSigner } from "./types";
import { postSync } from "./postSync";

export async function getCoinFrameworkCurrencyBridge(
  network: string,
  kind: string,
  customSigner?: CoinFrameworkSigner,
): Promise<CurrencyBridge> {
  const signer = customSigner ?? (await getSigner(network));
  return {
    scanAccounts: makeScanAccounts({
      getAccountShape: genericGetAccountShape(network, kind),
      getAddressFn: signer.getAddress.bind(signer),
      getAddressLookup: async currency => {
        const bridgeApi = await getBridgeApi(currency, network);
        return bridgeApi.addressLookup;
      },
      postSync,
    }),
  };
}
