import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TronSigner } from "@ledgerhq/coin-tron/types/index";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";

registerCoinModules(coinModuleLoaders);

type TronFrameworkSigner = {
  getAddress: (path: string) => Promise<{ address: string; publicKey: string }>;
  signTransaction: (path: string, rawTxHex: string) => Promise<string>;
};

export async function getBridges(
  _strategy: string,
  signer: TronSigner,
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const frameworkSigner: TronFrameworkSigner = {
    getAddress: path => signer.getAddress(path),
    signTransaction: (path, rawTxHex) => signer.sign(path, rawTxHex, []),
  };
  const frameworkContext: SignerContext<TronFrameworkSigner> = (_, fn) => fn(frameworkSigner);
  const frameworkGetAddress: GetAddressFn = async (deviceId, opts) => {
    const { address, publicKey } = await frameworkContext(deviceId, s => s.getAddress(opts.path));
    return { address, publicKey, path: opts.path };
  };

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("tron", "local", {
      context: frameworkContext,
      getAddress: frameworkGetAddress,
    }),
    accountBridge: await getCoinFrameworkAccountBridge("tron", "local", {
      context: frameworkContext,
      getAddress: frameworkGetAddress,
    }),
    getAddress: frameworkGetAddress,
  };
}
