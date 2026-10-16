import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import { getBridgeApi, getBridgeApiResolver } from "./bridge";
import { genericGetAccountShape } from "./getAccountShape";
import { getSigner } from "./signer";
import type { CoinFrameworkSigner } from "./types";
import { postSync } from "./postSync";
import { accountModulePostSync } from "./accountModule";
import { bindAddressLookup } from "./chainReads";

export async function getCoinFrameworkCurrencyBridge(
  network: string,
  kind: string,
  customSigner?: CoinFrameworkSigner,
): Promise<CurrencyBridge> {
  const signer = customSigner ?? (await getSigner(network));
  const resolveBridgeApi = await getBridgeApiResolver(network);
  return {
    scanAccounts: makeScanAccounts({
      getAccountShape: genericGetAccountShape(network, kind, signer),
      getAddressFn: signer.getAddress.bind(signer),
      getAddressLookup: async currency => {
        const { addressLookup } = await getBridgeApi(currency, network);
        return addressLookup && bindAddressLookup(addressLookup, currency);
      },
      postSync: (initial, synced) => {
        const binding = resolveBridgeApi(synced.currency).accountModule;
        return binding ? accountModulePostSync(binding, synced) : postSync(initial, synced);
      },
    }),
  };
}
