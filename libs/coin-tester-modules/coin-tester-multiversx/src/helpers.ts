import BigNumber from "bignumber.js";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { createBridges } from "@ledgerhq/coin-multiversx/bridge/js";
import resolver from "@ledgerhq/coin-multiversx/hw-getAddress";
import { MIN_GAS_LIMIT } from "@ledgerhq/coin-multiversx/constants";
import type { MultiversXSigner as LegacyMultiversXSigner } from "@ledgerhq/coin-multiversx/signer";
import type { Transaction } from "@ledgerhq/coin-multiversx/types";
import type { MultiversXSigner } from "./signer";

// Populate the coin-module registry so the generic coin framework can resolve
// multiversx's local API, bridge API and validate-address fn.
registerCoinModules(coinModuleLoaders);

export interface MultiversXBridges {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}

/** Map a GenericTransaction onto the legacy MultiversX transaction (send + ESDT only). */
function genericToMultiversxTransaction(gt: GenericTransaction): Transaction {
  return {
    family: "multiversx",
    mode: "send",
    amount: gt.amount ?? new BigNumber(0),
    recipient: gt.recipient,
    useAllAmount: gt.useAllAmount ?? false,
    subAccountId: gt.subAccountId,
    fees: null,
    // prepareTransaction overrides this (ESDT_TRANSFER for tokens); MIN for native.
    gasLimit: MIN_GAS_LIMIT,
  };
}

/**
 * Wrap the legacy MultiversX AccountBridge so it speaks GenericTransaction, letting
 * the same scenario drive both the legacy and generic-adapter strategies (mirrors
 * coin-tester-solana's adapter).
 */
function adaptLegacyBridge(bridge: AccountBridge<Transaction>): AccountBridge<GenericTransaction> {
  const preparedTxMap = new WeakMap<GenericTransaction, Transaction>();

  return {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    signRawOperation: bridge.signRawOperation,
    getEstimationRecipient: bridge.getEstimationRecipient,
    createTransaction: () => ({
      family: "multiversx",
      mode: "send",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
    }),
    updateTransaction: (tx, patch) => ({ ...tx, ...patch }),
    prepareTransaction: async (account, gt) => {
      const prepared = await bridge.prepareTransaction(account, genericToMultiversxTransaction(gt));
      const result: GenericTransaction = {
        ...gt,
        amount: prepared.amount,
        recipient: prepared.recipient,
        fees: prepared.fees ?? null,
      };
      preparedTxMap.set(result, prepared);
      return result;
    },
    getTransactionStatus: (account, gt) =>
      bridge.getTransactionStatus(
        account,
        preparedTxMap.get(gt) ?? genericToMultiversxTransaction(gt),
      ),
    signOperation: ({ account, transaction: gt, deviceId }) =>
      bridge.signOperation({
        account,
        transaction: preparedTxMap.get(gt) ?? genericToMultiversxTransaction(gt),
        deviceId,
      }),
    estimateMaxSpendable: ({ account, parentAccount, transaction: gt }) =>
      bridge.estimateMaxSpendable({
        account,
        parentAccount,
        transaction: gt ? genericToMultiversxTransaction(gt) : undefined,
      }),
  };
}

/**
 * Adapt the tester's local signer (`getAddress` + `signTransaction`) to the legacy
 * `MultiversXSigner` interface the `@ledgerhq/coin-multiversx` bridge expects.
 */
function toLegacySigner(signer: MultiversXSigner): LegacyMultiversXSigner {
  return {
    getAddress: async (path: string) => {
      const { address, publicKey } = await signer.getAddress(path);
      return { address, publicKey };
    },
    setAddress: async () => {},
    sign: async (path: string, message: string) => ({
      signature: Buffer.from(await signer.signTransaction(path, message), "hex"),
    }),
    provideESDTInfo: async () => ({}),
  };
}

/**
 * Wire the MultiversX bridges for the requested strategy, both speaking GenericTransaction.
 * - `legacy`: the `@ledgerhq/coin-multiversx` bridge, adapted to GenericTransaction.
 * - `generic-adapter`: the generic coin framework driving the Alpaca `createApi`.
 *
 * The network passed to the generic framework is the family name "multiversx"
 * (the currency id is "elrond" and is resolved internally from the account).
 */
export async function getBridges(
  strategy: BridgeStrategy,
  signer: MultiversXSigner,
): Promise<MultiversXBridges> {
  if (strategy === "legacy") {
    const signerContext: SignerContext<LegacyMultiversXSigner> = (_deviceId, fn) =>
      fn(toLegacySigner(signer));
    const getAddress = resolver(signerContext);
    const { currencyBridge, accountBridge } = createBridges(signerContext);
    return {
      currencyBridge,
      accountBridge: adaptLegacyBridge(accountBridge as unknown as AccountBridge<Transaction>),
      getAddress,
    };
  }

  const context: SignerContext<MultiversXSigner> = (_deviceId, fn) => fn(signer);
  const getAddress: GetAddressFn = (deviceId, { path, verify }) =>
    context(deviceId, s => s.getAddress(path, { verify }));
  const customSigner = { context, getAddress };

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("multiversx", "local", customSigner),
    accountBridge: await getCoinFrameworkAccountBridge("multiversx", "local", customSigner),
    getAddress,
  };
}
