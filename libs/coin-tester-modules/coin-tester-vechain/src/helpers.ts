import BigNumber from "bignumber.js";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-vechain/index";
import { createTransaction as legacyCreateTransaction } from "@ledgerhq/coin-vechain/bridge/createTransaction";
import type { Transaction, VechainSigner } from "@ledgerhq/coin-vechain/types";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import type { GenericVechainSigner } from "./signer";

registerCoinModules(coinModuleLoaders);

function genericToTransaction(tx: GenericTransaction): Transaction {
  // Reuse the production default (nonce, chainTag-from-config, blockRef/gas placeholders) instead
  // of duplicating it here — prepareTransaction (legacy) does not overwrite `body.chainTag`.
  // The account argument is ignored by the implementation (see bridge/createTransaction.ts).
  const base = legacyCreateTransaction({} as Account);
  return {
    ...base,
    amount: tx.amount,
    recipient: tx.recipient,
    useAllAmount: tx.useAllAmount ?? false,
    subAccountId: tx.subAccountId,
  };
}

/**
 * Wraps the legacy bridge as a `GenericTransaction` bridge so the same scenario can run through
 * both strategies. The real prepared legacy transaction is kept aside (keyed by the returned
 * generic transaction) so status/sign/broadcast reuse it instead of re-deriving from the lossy
 * generic shape.
 */
function adaptLegacyBridge(bridge: AccountBridge<Transaction>): AccountBridge<GenericTransaction> {
  const preparedTxMap = new WeakMap<GenericTransaction, Transaction>();

  // getTransactionStatus/signOperation must operate on the exact legacy Transaction that
  // prepareTransaction produced (real body/clauses/chainTag/nonce). If executeScenario ever stops
  // threading the same object reference, fail loudly instead of silently reconstructing a fresh
  // Transaction (new nonce/blockRef/gas) that no longer matches what was priced and status-checked.
  const requirePrepared = (gt: GenericTransaction): Transaction => {
    const prepared = preparedTxMap.get(gt);
    if (!prepared) {
      throw new Error(
        "coin-tester-vechain: no prepared legacy Transaction for this GenericTransaction — " +
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
      family: "vechain",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
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

export async function getBridges(
  strategy: BridgeStrategy,
  signer: { bridge: VechainSigner; generic: GenericVechainSigner },
  chainTag: number,
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  if (strategy === "legacy") {
    const context: SignerContext<VechainSigner> = (_, fn) => fn(signer.bridge);
    const getAddress: GetAddressFn = async (_deviceId, opts) => {
      const { address, publicKey } = await signer.bridge.getAddress(opts.path);
      return { address, publicKey, path: opts.path };
    };

    const { currencyBridge, accountBridge } = createBridges(context, () => ({
      status: { type: "active" as const },
      chainTag,
    }));
    return {
      currencyBridge,
      accountBridge: adaptLegacyBridge(accountBridge),
      getAddress,
    };
  }

  const frameworkContext: SignerContext<GenericVechainSigner> = (_, fn) => fn(signer.generic);
  const frameworkGetAddress: GetAddressFn = async (_deviceId, opts) => {
    const { address, publicKey } = await frameworkContext(_deviceId, s => s.getAddress(opts.path));
    return { address, publicKey, path: opts.path };
  };

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("vechain", "local", {
      context: frameworkContext,
      getAddress: frameworkGetAddress,
    }),
    accountBridge: await getCoinFrameworkAccountBridge("vechain", "local", {
      context: frameworkContext,
      getAddress: frameworkGetAddress,
    }),
    getAddress: frameworkGetAddress,
  };
}
