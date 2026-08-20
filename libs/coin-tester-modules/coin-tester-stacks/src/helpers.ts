import BigNumber from "bignumber.js";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
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
 * Devnet-only invariant: every scenario in this package always talks to the same local Clarinet
 * devnet, never mainnet/testnet, regardless of strategy. `GenericTransaction` has no `network`
 * field (that's legacy-bridge-specific -- the generic-adapter path derives its network from
 * `API_STACKS_NETWORK` instead), so this is hardcoded here rather than threaded through the
 * generic transaction shape.
 */
const DEVNET = "devnet" as const;

/**
 * Wraps the legacy bridge as a `GenericTransaction` bridge so the same send scenario can run
 * through both strategies (mirrors `coin-tester-vechain`'s `adaptLegacyBridge`). The real prepared
 * legacy transaction is kept aside (keyed by the returned generic transaction) so
 * status/sign/broadcast reuse it instead of re-deriving from the lossy generic shape.
 */
function adaptLegacyBridge(bridge: AccountBridge<Transaction>): AccountBridge<GenericTransaction> {
  const preparedTxMap = new WeakMap<GenericTransaction, Transaction>();

  // Reuses the bridge's own `createTransaction` default (anchorMode) instead of duplicating it
  // here or importing it separately -- `coin-stacks` has no exported subpath for it (unlike
  // coin-vechain's wildcard `"./*"` export), and the constructed bridge already exposes it.
  function genericToTransaction(tx: GenericTransaction): Transaction {
    const base = bridge.createTransaction({} as Account);
    return {
      ...base,
      network: DEVNET,
      amount: tx.amount,
      recipient: tx.recipient,
      useAllAmount: tx.useAllAmount ?? false,
      subAccountId: tx.subAccountId,
      fee: tx.customFees?.parameters.fees ?? undefined,
    };
  }

  // getTransactionStatus/signOperation must operate on the exact legacy Transaction that
  // prepareTransaction produced (real fee/nonce/anchorMode). If executeScenario ever stops
  // threading the same object reference, fail loudly instead of silently reconstructing a fresh
  // Transaction (new nonce) that no longer matches what was priced and status-checked.
  const requirePrepared = (gt: GenericTransaction): Transaction => {
    const prepared = preparedTxMap.get(gt);
    if (!prepared) {
      throw new Error(
        "coin-tester-stacks: no prepared legacy Transaction for this GenericTransaction — " +
          "the object reference from prepareTransaction was lost before getTransactionStatus/signOperation",
      );
    }
    return prepared;
  };

  return {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    signRawOperation: bridge.signRawOperation,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    createTransaction: () => ({
      family: "stacks",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      assetReference: "",
      assetOwner: "",
    }),
    updateTransaction: (tx, patch) => ({ ...tx, ...patch }),
    prepareTransaction: async (account, gt) => {
      const prepared = await bridge.prepareTransaction(account, genericToTransaction(gt));
      const result: GenericTransaction = {
        ...gt,
        amount: prepared.amount,
        recipient: prepared.recipient,
      };
      preparedTxMap.set(result, prepared);
      return result;
    },
    getTransactionStatus: (account, gt) =>
      bridge.getTransactionStatus(account, requirePrepared(gt)),
    signOperation: ({ account, transaction: gt, deviceId }) =>
      bridge.signOperation({
        account,
        transaction: requirePrepared(gt),
        deviceId,
      }),
    estimateMaxSpendable: ({ account, parentAccount, transaction: gt }) =>
      bridge.estimateMaxSpendable({
        account,
        parentAccount,
        transaction: gt ? genericToTransaction(gt) : undefined,
      }),
  };
}

/**
 * `legacy` wraps the classic bridge behind `adaptLegacyBridge` so both strategies expose the same
 * `AccountBridge<GenericTransaction>` shape to `executeScenario` -- the send scenario runs
 * unmodified through either. `generic-adapter` goes through `getCoinFrameworkAccountBridge`/
 * `getCoinFrameworkCurrencyBridge` (the same shared wrapper VeChain's/NEAR's coin-testers use)
 * against `coin-stacks`'s Alpaca (`CoinModuleApi`) surface directly -- this is the only strategy
 * that can exercise pox-5 staking (`delegate`/`undelegate`), since the legacy bridge has no
 * staking code at all. Not gated by `genericCoinFrameworkFamilies.json`: that file controls the
 * production app's own strategy selection, not whether this factory function works for a given
 * family -- it only needs `loaders.ts`'s `loadLocalApi`/`loadBridgeApi` entries for `"stacks"`,
 * which already exist.
 */
export async function getBridges(
  strategy: BridgeStrategy,
  signer: { legacy: StacksSigner; generic: GenericStacksSigner },
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
}> {
  if (strategy === "legacy") {
    const context: SignerContext<StacksSigner> = (_deviceId, fn) => fn(signer.legacy);
    const { currencyBridge, accountBridge } = createBridges(context);
    return { currencyBridge, accountBridge: adaptLegacyBridge(accountBridge) };
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
