import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { GenericBitcoinSigner } from "./signer";

// Register every coin module loader so the generic framework can resolve coin-bitcoin's local
// (Alpaca) createApi and its BridgeApi (usesDescriptorDerivationPath) for the "bitcoin" family.
registerCoinModules(coinModuleLoaders);

function bitcoinGenericGetAddress(
  signerContext: SignerContext<GenericBitcoinSigner>,
): GetAddressFn {
  return async (deviceId, { path }) => {
    const { address, publicKey } = await signerContext(deviceId, s => s.getAddress(path));
    return { address, publicKey, path };
  };
}

/**
 * Build the generic-coin-framework bridges for Bitcoin, backed by the software {@link
 * GenericBitcoinSigner}. `network` is the FAMILY ("bitcoin") — that is what the app passes and what
 * `getBridgeApi` resolves the BridgeApi by; the specific currency (bitcoin_regtest) comes from the
 * account itself.
 */
export async function getBitcoinGenericBridges(signer: GenericBitcoinSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const signerContext: SignerContext<GenericBitcoinSigner> = (_deviceId, fn) => fn(signer);
  const getAddress = bitcoinGenericGetAddress(signerContext);

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
