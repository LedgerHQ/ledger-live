import BigNumber from "bignumber.js";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { createBridges } from "@ledgerhq/coin-ton/bridge/js";
import type { TonSigner } from "@ledgerhq/coin-ton/signer";
import type { TonAccount, Transaction } from "@ledgerhq/coin-ton/types";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { scenarioCoinConfig } from "./fixtures";
import { type TonSoftwareSigner, buildLegacySigner, buildSigner } from "./signer";

// Registers the loaders, so the generic framework resolves coin-ton's local createApi.
registerCoinModules(coinModuleLoaders);

type Bridges = {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
};

const toLegacy = (transaction: GenericTransaction): Transaction => ({
  family: "ton",
  amount: transaction.amount,
  recipient: transaction.recipient,
  useAllAmount: transaction.useAllAmount ?? false,
  fees: new BigNumber(0),
  comment: { isEncrypted: false, text: transaction.memoValue ?? "" },
});

/**
 * Lets the scenario drive the legacy bridge with `GenericTransaction`s. The status check and the
 * signature get the legacy transaction `prepareTransaction` returned, which carries the fees.
 */
function adaptLegacyBridge(
  bridge: AccountBridge<Transaction, TonAccount>,
): AccountBridge<GenericTransaction> {
  const prepared = new WeakMap<GenericTransaction, Transaction>();
  const preparedFor = (transaction: GenericTransaction): Transaction => {
    const legacy = prepared.get(transaction);
    if (!legacy) throw new Error("The transaction did not go through prepareTransaction");
    return legacy;
  };

  const adapted = {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    signRawOperation: bridge.signRawOperation,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    createTransaction: (): GenericTransaction => ({
      family: "ton",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
    }),
    updateTransaction: (transaction: GenericTransaction, patch: Partial<GenericTransaction>) => ({
      ...transaction,
      ...patch,
    }),
    prepareTransaction: async (account: Account, transaction: GenericTransaction) => {
      const legacy = await bridge.prepareTransaction(account as TonAccount, toLegacy(transaction));
      const result: GenericTransaction = { ...transaction, amount: legacy.amount };
      prepared.set(result, legacy);
      return result;
    },
    getTransactionStatus: (account: Account, transaction: GenericTransaction) =>
      bridge.getTransactionStatus(account as TonAccount, preparedFor(transaction)),
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
        account: account as TonAccount,
        transaction: preparedFor(transaction),
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
        account: account as TonAccount,
        parentAccount: parentAccount as TonAccount | null | undefined,
        transaction: transaction ? toLegacy(transaction) : undefined,
      }),
  };

  return adapted as unknown as AccountBridge<GenericTransaction>;
}

function getLegacyBridges(signer: TonSigner): Bridges {
  const signerContext: SignerContext<TonSigner> = (_deviceId, fn) => fn(signer);
  const { currencyBridge, accountBridge } = createBridges(signerContext, () => scenarioCoinConfig);
  return { currencyBridge, accountBridge: adaptLegacyBridge(accountBridge) };
}

async function getGenericBridges(signer: TonSoftwareSigner): Promise<Bridges> {
  const signerContext: SignerContext<TonSoftwareSigner> = (_deviceId, fn) => fn(signer);
  const getAddress: GetAddressFn = async (deviceId, { path }) =>
    signerContext(deviceId, s => s.getAddress(path));
  const options = { context: signerContext, getAddress };
  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("ton", "local", options),
    accountBridge: await getCoinFrameworkAccountBridge("ton", "local", options),
  };
}

/** The ton family's bridges, backed by a software signer: production's legacy one or the generic one. */
export const getTonBridges = (strategy: BridgeStrategy): Promise<Bridges> =>
  strategy === "legacy"
    ? Promise.resolve(getLegacyBridges(buildLegacySigner()))
    : getGenericBridges(buildSigner());
