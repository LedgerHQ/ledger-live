import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { KaspaSigner } from "@ledgerhq/coin-kaspa/types/signer";
import kaspaResolver from "@ledgerhq/coin-kaspa/hw-getAddress";
import { createBridges } from "@ledgerhq/coin-kaspa/bridge";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import type { Signers, GenericKaspaSigner } from "./signer";

registerCoinModules(coinModuleLoaders);

function kaspaGetAddress(signerContext: SignerContext<GenericKaspaSigner>): GetAddressFn {
  return async (deviceId, { path, verify }) => {
    const { address, publicKey } = await signerContext(deviceId, s => s.getAddress(path, verify));
    return { address, publicKey, path };
  };
}

export async function getBridges(
  strategy: BridgeStrategy,
  signers: Signers,
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  if (strategy === "legacy") {
    const signerContext: SignerContext<KaspaSigner> = (_, fn) => fn(signers.bridge);
    const getAddress = kaspaResolver(signerContext);
    const { currencyBridge, accountBridge } = createBridges(signerContext);
    return {
      currencyBridge,
      accountBridge: accountBridge as unknown as AccountBridge<GenericTransaction>,
      getAddress,
    };
  }

  const signerContext: SignerContext<GenericKaspaSigner> = (_, fn) => fn(signers.generic);
  const getAddress = kaspaGetAddress(signerContext);

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("kaspa", "local", {
      context: signerContext,
      getAddress,
    }),
    accountBridge: await getCoinFrameworkAccountBridge("kaspa", "local", {
      context: signerContext,
      getAddress,
    }),
    getAddress,
  };
}
