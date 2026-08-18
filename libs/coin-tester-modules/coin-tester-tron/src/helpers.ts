import BigNumber from "bignumber.js";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-tron/bridge";
import signerGetAddress from "@ledgerhq/coin-tron/signer";
import type { Transaction, TronSigner } from "@ledgerhq/coin-tron/types/index";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { TRON_LOCAL_RPC } from "./fixtures";

registerCoinModules(coinModuleLoaders);

// The generic coin framework signs through `signer.signTransaction(path, rawTxHex)`,
// while the legacy TronSigner exposes `sign(path, rawTxHex, tokenSignatures)`. This
// adapter lets the generic-adapter strategy reuse the same in-memory test signer.
type TronFrameworkSigner = {
  getAddress: (path: string) => Promise<{ address: string; publicKey: string }>;
  signTransaction: (path: string, rawTxHex: string) => Promise<string>;
};

function genericToTransaction(tx: GenericTransaction): Transaction {
  return {
    family: "tron",
    mode: "send",
    amount: tx.amount,
    recipient: tx.recipient,
    useAllAmount: tx.useAllAmount ?? false,
    subAccountId: tx.subAccountId,
    resource: null,
    networkInfo: null,
    duration: 3,
    votes: [],
  };
}

// Wraps the legacy bridge as a `GenericTransaction` bridge so the same scenario
// can run through both strategies. The real prepared legacy transaction is kept
// aside (keyed by the returned generic transaction) so status/sign/broadcast
// reuse it instead of re-deriving from the lossy generic shape.
function adaptLegacyBridge(bridge: AccountBridge<Transaction>): AccountBridge<GenericTransaction> {
  const preparedTxMap = new WeakMap<GenericTransaction, Transaction>();

  return {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    signRawOperation: bridge.signRawOperation,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    createTransaction: () => ({
      family: "tron",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
      mode: "send",
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
      bridge.getTransactionStatus(account, preparedTxMap.get(gt) ?? genericToTransaction(gt)),
    signOperation: ({ account, transaction: gt, deviceId }) =>
      bridge.signOperation({
        account,
        transaction: preparedTxMap.get(gt) ?? genericToTransaction(gt),
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
  signer: TronSigner,
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const context: SignerContext<TronSigner> = (_, fn) => fn(signer);
  const getAddress = signerGetAddress(context);

  if (strategy === "legacy") {
    const { currencyBridge, accountBridge } = createBridges(context, () => ({
      explorer: { url: TRON_LOCAL_RPC },
      status: { type: "active" as const },
    }));
    return {
      currencyBridge,
      accountBridge: adaptLegacyBridge(accountBridge as unknown as AccountBridge<Transaction>),
      getAddress,
    };
  }

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
