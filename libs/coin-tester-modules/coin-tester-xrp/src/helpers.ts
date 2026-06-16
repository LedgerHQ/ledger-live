import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import xrpResolver from "@ledgerhq/live-common/families/xrp/getAddress";
import type { XrpSigner } from "@ledgerhq/live-common/families/xrp/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";

registerCoinModules(coinModuleLoaders);

const NETWORK = "ripple";

/**
 * Get the bridges for the XRP family.
 */
export async function getBridges(signer: XrpSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const context: SignerContext<XrpSigner> = (_, fn) => fn(signer);
  const getAddress = xrpResolver(context);

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge(NETWORK, "local", { context, getAddress }),
    accountBridge: await getCoinFrameworkAccountBridge(NETWORK, "local", { context, getAddress }),
    getAddress,
  };
}
