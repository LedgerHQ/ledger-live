import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { GenericBitcoinSigner } from "./signer";

// Registers the loaders, so the generic framework resolves coin-bitcoin's local createApi.
registerCoinModules(coinModuleLoaders);

/**
 * Generic coin framework bridges of the bitcoin family, backed by the software
 * {@link GenericBitcoinSigner}. The family ("bitcoin") selects the coin module; the currency
 * (bitcoin_regtest) comes from the account.
 */
export async function getBitcoinGenericBridges(signer: GenericBitcoinSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const signerContext: SignerContext<GenericBitcoinSigner> = (_deviceId, fn) => fn(signer);
  const getAddress: GetAddressFn = async (deviceId, { path }) => {
    const { address, publicKey } = await signerContext(deviceId, s => s.getAddress(path));
    return { address, publicKey, path };
  };
  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("bitcoin", "local", {
      context: signerContext,
      getAddress,
    }),
    accountBridge: await getCoinFrameworkAccountBridge("bitcoin", "local", {
      context: signerContext,
      getAddress,
    }),
    getAddress,
  };
}
