import type { CryptoCurrency } from "@domain/entity-currency-crypto";
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
  // Optional: the coin-tester helpers have none, and fall back to the default derivation walk.
  currency?: CryptoCurrency,
): Promise<CurrencyBridge> {
  const signer = customSigner ?? (await getSigner(network));
  const bridgeApi = currency ? await getBridgeApi(currency, network) : undefined;
  return {
    scanAccounts: makeScanAccounts({
      getAccountShape: genericGetAccountShape(network, kind),
      getAddressFn: signer.getAddress.bind(signer),
      listAddressesForKey: bridgeApi?.getAddressesByPublicKey,
      postSync,
    }),
  };
}
