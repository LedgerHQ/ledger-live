import BigNumber from "bignumber.js";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-tron/bridge";
import signerGetAddress from "@ledgerhq/coin-tron/signer";
import type { Transaction, TronAccount, TronSigner } from "@ledgerhq/coin-tron/types/index";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import {
  tronGetAddress,
  type TronFrameworkSigner,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/families/tron/signer";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { TRON_LOCAL_RPC } from "./fixtures";
import type { TronTestSigner } from "./signer";

registerCoinModules(coinModuleLoaders);

function adaptLegacyBridge(
  bridge: AccountBridge<Transaction>,
): AccountBridge<GenericTransaction> {
  const preparedTxMap = new WeakMap<GenericTransaction, Transaction>();

  function toNative(gt: GenericTransaction): Transaction {
    return {
      family: "tron",
      mode: "send",
      amount: gt.amount,
      recipient: gt.recipient,
      useAllAmount: gt.useAllAmount ?? false,
      subAccountId: gt.subAccountId,
      duration: 3,
      networkInfo: null,
      resource: null,
      votes: [],
    };
  }

  return {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    signRawOperation: bridge.signRawOperation,
    createTransaction: () => ({
      family: "tron",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      mode: "send",
    }),
    updateTransaction: (tx, patch) => ({ ...tx, ...patch }),
    prepareTransaction: async (account, gt) => {
      const prepared = await bridge.prepareTransaction(account, toNative(gt));
      const result: GenericTransaction = {
        ...gt,
        amount: prepared.amount,
        recipient: prepared.recipient,
      };
      preparedTxMap.set(result, prepared);
      return result;
    },
    getTransactionStatus: (account, gt) =>
      bridge.getTransactionStatus(account, preparedTxMap.get(gt) ?? toNative(gt)),
    signOperation: ({ account, transaction: gt, deviceId }) =>
      bridge.signOperation({
        account,
        transaction: preparedTxMap.get(gt) ?? toNative(gt),
        deviceId,
      }),
    estimateMaxSpendable: ({ account, parentAccount, transaction: gt }) =>
      bridge.estimateMaxSpendable({
        account,
        parentAccount,
        transaction: gt ? toNative(gt) : undefined,
      }),
  };
}

export async function getLegacyBridges(signer: TronSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction, TronAccount>;
  getAddress: GetAddressFn;
}> {
  const signerContext: SignerContext<TronSigner> = (_, fn) => fn(signer);
  const getAddress = signerGetAddress(signerContext);
  const { currencyBridge, accountBridge } = createBridges(signerContext, () => ({
    explorer: { url: TRON_LOCAL_RPC },
    status: { type: "active" as const },
  }));
  return { currencyBridge, accountBridge, getAddress };
}

export async function getGenericBridges(signer: TronTestSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const legacy = await getLegacyBridges(signer);

  const fwContext: SignerContext<TronFrameworkSigner> = (_, fn) => fn(signer.framework);
  const fwGetAddress = tronGetAddress(fwContext);
  const currencyBridge = await getCoinFrameworkCurrencyBridge("tron", "local", {
    context: fwContext,
    getAddress: fwGetAddress,
  });
  const accountBridge = await getCoinFrameworkAccountBridge("tron", "local", {
    context: fwContext,
    getAddress: fwGetAddress,
  });

  return {
    currencyBridge: currencyBridge as CurrencyBridge,
    accountBridge: accountBridge as AccountBridge<GenericTransaction>,
    getAddress: legacy.getAddress,
  };
}

export async function getDualBridges(
  strategy: BridgeStrategy,
  signer: TronTestSigner,
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  if (strategy === "legacy") {
    const legacy = await getLegacyBridges(signer);
    return {
      currencyBridge: legacy.currencyBridge,
      accountBridge: adaptLegacyBridge(
        legacy.accountBridge as unknown as AccountBridge<Transaction>,
      ),
      getAddress: legacy.getAddress,
    };
  }
  return getGenericBridges(signer);
}
