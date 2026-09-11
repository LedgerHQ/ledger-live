import { createApi as createBitcoinApi } from "@ledgerhq/coin-bitcoin/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

/**
 * Local (Alpaca) coin-module API for Bitcoin, consumed by the generic-coin-framework.
 *
 * NOTE: Bitcoin is intentionally NOT enabled in `genericCoinFrameworkFamilies.json` — the shipping
 * app keeps routing Bitcoin through the legacy bridge. This wrapper exists so the coin-tester (and
 * future opt-in) can drive the generic framework against coin-bitcoin's `createApi`.
 */
export function createLocalBitcoinApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createBitcoinApi(currencyId) as unknown as CoinModuleApi<any> & BridgeApi;
}

/**
 * BridgeApi for Bitcoin on the generic path. Bitcoin's account is an extended public key
 * (descriptor model), so — unlike the address-based chains — the generic framework must forward the
 * account's `derivationPath` to `getBalance`/`listOperations`. `usesDescriptorDerivationPath` opts
 * this family into that behaviour; every other family leaves it unset and is unaffected.
 */
export const bitcoinBridgeApi: BridgeApi = {
  usesDescriptorDerivationPath: true,
};
