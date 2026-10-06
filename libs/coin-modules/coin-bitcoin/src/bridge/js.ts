import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { makeGetAccountShape, makePostSync } from "../synchronisation";
import { assignToAccountRaw, makeAssignFromAccountRaw } from "../serialization";
import { BitcoinAccount, Transaction, TransactionStatus } from "../types";
import formatters from "../formatters";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getSerializedAddressParameters } from "../exchange";
import { prepareTransaction } from "../prepareTransaction";
import { updateTransaction } from "../updateTransaction";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import type { BitcoinContext } from "../config";
import { resolveAccountConfig } from "../explorer";
import { calculateFees } from "./../cache";
import { SignerContext } from "../signer";
import { broadcast } from "../broadcast";
import { perCoinLogic } from "../logic";
import resolver from "../hw-getAddress";
import getFullViewingKeyResolver, { GetFullViewingKeyResult } from "../hw-getFullViewingKey";
import { validateAddress } from "../validateAddress";
import buildSignRawOperation from "../signRawOperation";
import { getBitcoinEstimationRecipient } from "../constants";
// Registers the Zcash chain adapter (transparent Zcash is served by this bridge).
import "../chain-adapters/zcash";

type GetFullViewingKeyFromBridgeFn = (
  account: BitcoinAccount,
  options: { deviceId: string; path?: string },
) => Promise<GetFullViewingKeyResult>;

export type BitcoinAccountBridge = AccountBridge<Transaction, BitcoinAccount, TransactionStatus> & {
  getFullViewingKey: GetFullViewingKeyFromBridgeFn;
};

function buildCurrencyBridge(signerContext: SignerContext, context: BitcoinContext) {
  const getAddress = resolver(signerContext, context.logger);
  const scanAccounts = makeScanAccounts<BitcoinAccount>({
    getAccountShape: makeGetAccountShape(signerContext, context),
    getAddressFn: getAddressWrapper(getAddress),
    postSync: makePostSync(context),
  });

  return {
    scanAccounts,
  };
}

function buildAccountBridge(signerContext: SignerContext, context: BitcoinContext) {
  const sync = makeSync<Transaction, BitcoinAccount, TransactionStatus>({
    getAccountShape: makeGetAccountShape(signerContext, context),
    postSync: makePostSync(context),
    shouldMergeOps: false,
  });

  const getAddress = resolver(signerContext, context.logger);
  const getFullViewingKey = getFullViewingKeyResolver(signerContext, context.logger);
  const injectGetAddressParams = (account: BitcoinAccount) => {
    const perCoin = perCoinLogic[account.currency.id];

    if (perCoin && perCoin.injectGetAddressParams) {
      return perCoin.injectGetAddressParams(account);
    }
  };
  const receive = makeAccountBridgeReceive<BitcoinAccount>(getAddressWrapper(getAddress), {
    injectGetAddressParams,
  });

  const wrappedBroadcast: AccountBridge<Transaction, BitcoinAccount>["broadcast"] = async ({
    account,
    signedOperation,
    broadcastConfig,
  }) => {
    calculateFees.reset();
    await resolveAccountConfig(context, account);
    return broadcast({
      account,
      signedOperation,
      ...(broadcastConfig ? { broadcastConfig } : {}),
    });
  };

  const getFullViewingKeyFromBridge: GetFullViewingKeyFromBridgeFn = (account, options) =>
    getFullViewingKey(options.deviceId, {
      currency: account.currency,
      path: options.path ?? account.freshAddressPath,
    });

  // Every method below that reaches the explorer resolves the coin config first, which also binds
  // the explorer of a deserialized account (see resolveAccountConfig).
  const accountBridge: BitcoinAccountBridge = {
    estimateMaxSpendable: async params => {
      await resolveAccountConfig(context, getMainAccount(params.account, params.parentAccount));
      return estimateMaxSpendable(context.logger, params);
    },
    createTransaction,
    prepareTransaction: async (account, transaction) =>
      prepareTransaction(
        await resolveAccountConfig(context, account),
        context.logger,
        account,
        transaction,
      ),
    updateTransaction,
    getTransactionStatus: async (account, transaction) =>
      getTransactionStatus(
        await resolveAccountConfig(context, account),
        context.logger,
        account,
        transaction,
      ),
    receive,
    sync,
    signOperation: buildSignOperation(signerContext, context),
    signRawOperation: buildSignRawOperation(signerContext, context.logger),
    broadcast: wrappedBroadcast,
    assignFromAccountRaw: makeAssignFromAccountRaw(context.logger),
    assignToAccountRaw,
    formatAccountSpecifics: formatters.formatAccountSpecifics,
    getSerializedAddressParameters,
    validateAddress,
    getFullViewingKey: getFullViewingKeyFromBridge,
    getEstimationRecipient: (account: Account) =>
      getBitcoinEstimationRecipient(account.currency.id),
  };
  return accountBridge;
}

export function createBridges(signerContext: SignerContext, context: BitcoinContext) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext, context),
    accountBridge: buildAccountBridge(signerContext, context),
  };
}
