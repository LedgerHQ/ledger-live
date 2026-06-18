import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { StellarSigner } from "./signer";

registerCoinModules(coinModuleLoaders);

export async function getBridges(signer: StellarSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  // The module namespace `signer` exposes `getPublicKey`, `getAddress` and
  // `signTransaction` as own properties — i.e. exactly the contract the
  // framework's SignerContext callback expects.
  const context: SignerContext<typeof signer> = (_, fn) => fn(signer);

  const getAddress: GetAddressFn = async (deviceId, { path, verify }) => {
    // Delegate to the signer implementation so address/publicKey formatting stays consistent.
    return context(deviceId, s => s.getAddress(path, { verify }));
  };
  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("stellar", "local", {
      context,
      getAddress,
    }),
    accountBridge: await getCoinFrameworkAccountBridge("stellar", "local", {
      context,
      getAddress,
    }),
    getAddress,
  };
}
