import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { TonSoftwareSigner } from "./signer";

// Registers the loaders, so the generic framework resolves coin-ton's local createApi.
registerCoinModules(coinModuleLoaders);

/** Generic coin framework bridges of the ton family, backed by the software signer. */
export async function getTonGenericBridges(signer: TonSoftwareSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
}> {
  const signerContext: SignerContext<TonSoftwareSigner> = (_deviceId, fn) => fn(signer);
  const getAddress: GetAddressFn = async (deviceId, { path }) =>
    signerContext(deviceId, s => s.getAddress(path));
  const options = { context: signerContext, getAddress };
  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("ton", "local", options),
    accountBridge: await getCoinFrameworkAccountBridge("ton", "local", options),
  };
}
