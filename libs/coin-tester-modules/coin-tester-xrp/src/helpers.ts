import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import xrpResolver from "@ledgerhq/live-common/families/xrp/getAddress";
import type { XrpSigner } from "@ledgerhq/live-common/families/xrp/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getXrpRpc } from "./rippled";
import { makeWallet, type XrplWallet } from "./signer";

registerCoinModules(coinModuleLoaders);

// Keyed by family, as Ledger Live does: with the currency id, no XRP bridge API (tokens) would load
const FAMILY = "xrp";

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
    currencyBridge: await getCoinFrameworkCurrencyBridge(FAMILY, "local", { context, getAddress }),
    accountBridge: await getCoinFrameworkAccountBridge(FAMILY, "local", { context, getAddress }),
    getAddress,
  };
}

/** Points `ripple` at the sandbox node. Without `enabledTokenStandards`, every token standard is off. */
export function setLocalXrpConfig(enabledTokenStandards?: string[]): void {
  LiveConfig.setConfig({
    config_currency_ripple: {
      type: "object",
      default: {
        status: { type: "active" },
        name: "XRP",
        unit: { name: "XRP", code: "XRP", magnitude: 6 },
        node: getXrpRpc(),
        ...(enabledTokenStandards && { enabledTokenStandards }),
      },
    },
  });
}

/** A new account, funded with `xrp` XRP. The sandbox validates the ledger before it answers. */
export async function createFundedWallet(sandbox: Sandbox, xrp: number): Promise<XrplWallet> {
  const wallet = makeWallet();
  await sandbox.airdrop(wallet.address, xrp);

  return wallet;
}
