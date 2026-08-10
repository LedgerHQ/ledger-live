import BigNumber from "bignumber.js";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-near/bridge/js";
import nearResolver from "@ledgerhq/coin-near/hw-getAddress";
import type { NearSigner } from "@ledgerhq/coin-near/signer";
import type { NearAccount, Transaction } from "@ledgerhq/coin-near/types";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { coinConfig } from "./fixtures";
import type { FrameworkNearSigner, Signers } from "./signer";

registerCoinModules(coinModuleLoaders);

function genericToTransaction(tx: GenericTransaction): Transaction {
  return {
    family: "near",
    mode: tx.mode ?? "send",
    amount: tx.amount ?? new BigNumber(0),
    recipient: tx.recipient ?? "",
    useAllAmount: tx.useAllAmount ?? false,
  } as Transaction;
}

// Adapts the legacy bridge to `GenericTransaction`; the prepared legacy tx is kept aside (keyed by
// the generic one) so status/sign/broadcast reuse the exact object prepareTransaction produced.
function adaptLegacyBridge(
  bridge: AccountBridge<Transaction, NearAccount>,
): AccountBridge<GenericTransaction> {
  const prepared = new WeakMap<GenericTransaction, Transaction>();

  const requirePrepared = (tx: GenericTransaction): Transaction => {
    const found = prepared.get(tx);
    if (!found) {
      throw new Error(
        "coin-tester-near: no prepared legacy transaction for this generic transaction — " +
          "the reference from prepareTransaction was lost before status/sign",
      );
    }
    return found;
  };

  // Same runtime object, different declared type (NearAccount vs generic Account) — asserted, not restructured.
  const adapted = {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    signRawOperation: bridge.signRawOperation,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    createTransaction: (): GenericTransaction =>
      ({
        family: "near",
        mode: "send",
        amount: new BigNumber(0),
        recipient: "",
        useAllAmount: false,
      }) as unknown as GenericTransaction,
    updateTransaction: (tx: GenericTransaction, patch: Partial<GenericTransaction>) => ({
      ...tx,
      ...patch,
    }),
    prepareTransaction: async (account: Account, tx: GenericTransaction) => {
      const legacy = await bridge.prepareTransaction(
        account as unknown as NearAccount,
        genericToTransaction(tx),
      );
      const result: GenericTransaction = {
        ...tx,
        amount: legacy.amount,
        recipient: legacy.recipient,
      };
      prepared.set(result, legacy);
      return result;
    },
    getTransactionStatus: (account: Account, tx: GenericTransaction) =>
      bridge.getTransactionStatus(account as unknown as NearAccount, requirePrepared(tx)),
    signOperation: ({
      account,
      transaction,
      deviceId,
    }: {
      account: Account;
      transaction: GenericTransaction;
      deviceId: string;
    }) =>
      bridge.signOperation({
        account: account as unknown as NearAccount,
        transaction: requirePrepared(transaction),
        deviceId,
      }),
    estimateMaxSpendable: ({
      account,
      parentAccount,
      transaction,
    }: {
      account: Account;
      parentAccount?: Account | null;
      transaction?: GenericTransaction | null;
    }) =>
      bridge.estimateMaxSpendable({
        account: account as never,
        parentAccount: parentAccount as never,
        transaction: transaction ? genericToTransaction(transaction) : undefined,
      }),
  };

  return adapted as unknown as AccountBridge<GenericTransaction>;
}

export async function getBridges(
  strategy: BridgeStrategy,
  signers: Signers,
  rpcUrl: string,
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  if (strategy === "legacy") {
    const context: SignerContext<NearSigner> = (_, fn) => fn(signers.bridge);
    const { currencyBridge, accountBridge } = createBridges(context, coinConfig(rpcUrl));

    return {
      currencyBridge,
      accountBridge: adaptLegacyBridge(accountBridge),
      getAddress: nearResolver(context),
    };
  }

  const context: SignerContext<FrameworkNearSigner> = (_, fn) => fn(signers.coinframework);
  const getAddress: GetAddressFn = async (deviceId, { path, verify }) =>
    context(deviceId, signer => signer.getAddress(path, { verify })) as ReturnType<GetAddressFn>;

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("near", "local", { context, getAddress }),
    accountBridge: await getCoinFrameworkAccountBridge("near", "local", { context, getAddress }),
    getAddress,
  };
}
