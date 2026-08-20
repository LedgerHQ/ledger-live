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
  // Only known at `impl.ts`'s single call site — the coin-tester helpers that call this directly
  // never have one, so account discovery falls back to the default derivation-path walk for them.
  currency?: CryptoCurrency,
): Promise<CurrencyBridge> {
  const signer = customSigner ?? (await getSigner(network));
  const bridgeApi = currency ? await getBridgeApi(currency, network) : undefined;
  return {
    scanAccounts: makeScanAccounts({
      getAccountShape: genericGetAccountShape(network, kind),
      getAddressFn: signer.getAddress.bind(signer),
      buildIterateResult: bridgeApi?.buildIterateResult,
      postSync,
    }),
  };
}
