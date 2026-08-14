import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-stacks";
import type { StacksSigner, Transaction } from "@ledgerhq/coin-stacks/types";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import type { GenericStacksSigner } from "./genericSigner";

registerCoinModules(coinModuleLoaders);

/**
 * `legacy` builds the classic bridge exactly as before. `generic-adapter` goes through
 * `getCoinFrameworkAccountBridge`/`getCoinFrameworkCurrencyBridge` (the same shared wrapper
 * VeChain's/NEAR's coin-testers use) against `coin-stacks`'s Alpaca (`CoinModuleApi`) surface --
 * this is the only strategy that can exercise pox-5 staking (`delegate`/`undelegate`), since the
 * legacy bridge has no staking code at all. Not gated by `genericCoinFrameworkFamilies.json`:
 * that file controls the production app's own strategy selection, not whether this factory
 * function works for a given family -- it only needs `loaders.ts`'s `loadLocalApi`/`loadBridgeApi`
 * entries for `"stacks"`, which already exist.
 */
export async function getBridges(
  strategy: BridgeStrategy,
  signer: { legacy: StacksSigner; generic: GenericStacksSigner },
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction> | AccountBridge<GenericTransaction>;
}> {
  if (strategy === "legacy") {
    const context: SignerContext<StacksSigner> = (_deviceId, fn) => fn(signer.legacy);
    return createBridges(context);
  }

  const frameworkContext: SignerContext<GenericStacksSigner> = (_deviceId, fn) =>
    fn(signer.generic);
  const frameworkGetAddress: GetAddressFn = async (deviceId, opts) => {
    const { address, publicKey } = await frameworkContext(deviceId, s => s.getAddress(opts.path));
    return { address, publicKey, path: opts.path };
  };

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("stacks", "local", {
      context: frameworkContext,
      getAddress: frameworkGetAddress,
    }),
    accountBridge: await getCoinFrameworkAccountBridge("stacks", "local", {
      context: frameworkContext,
      getAddress: frameworkGetAddress,
    }),
  };
}
