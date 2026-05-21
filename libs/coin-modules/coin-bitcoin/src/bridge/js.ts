import { AccountBridge } from "@ledgerhq/types-live";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { makeGetAccountShape, postSync } from "../synchronisation";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { BitcoinAccount, Transaction, TransactionStatus } from "../types";
import formatters from "../formatters";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getSerializedAddressParameters } from "../exchange";
import { prepareTransaction } from "../prepareTransaction";
import { updateTransaction } from "../updateTransaction";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import { CoinConfig, setCoinConfig } from "../config";
import { calculateFees } from "./../cache";
import { SignerContext } from "../signer";
import { broadcast } from "../broadcast";
import { perCoinLogic } from "../logic";
import resolver from "../hw-getAddress";
import getFullViewingKeyResolver, { GetFullViewingKeyResult } from "../hw-getFullViewingKey";
import { validateAddress } from "../validateAddress";
import buildSignRawOperation from "../signRawOperation";

type GetFullViewingKeyFromBridgeFn = (
  account: BitcoinAccount,
  options: { deviceId: string; path?: string },
) => Promise<GetFullViewingKeyResult>;

export type BitcoinAccountBridge = AccountBridge<Transaction, BitcoinAccount> & {
  getFullViewingKey: GetFullViewingKeyFromBridgeFn;
};

function buildCurrencyBridge(signerContext: SignerContext) {
  const getAddress = resolver(signerContext);
  const scanAccounts = makeScanAccounts<BitcoinAccount>({
    getAccountShape: makeGetAccountShape(signerContext),
    getAddressFn: getAddressWrapper(getAddress),
    postSync,
  });

  return {
    scanAccounts,
    preload: () => Promise.resolve({}),
    hydrate: () => {},
  };
}

function buildAccountBridge(signerContext: SignerContext) {
  const sync = makeSync<Transaction, BitcoinAccount, TransactionStatus>({
    getAccountShape: makeGetAccountShape(signerContext),
    postSync,
    shouldMergeOps: false,
  });

  const getAddress = resolver(signerContext);
  const getFullViewingKey = getFullViewingKeyResolver(signerContext);
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

  return {
    estimateMaxSpendable,
    createTransaction,
    prepareTransaction,
    updateTransaction,
    getTransactionStatus,
    receive,
    sync,
    signOperation: buildSignOperation(signerContext),
    signRawOperation: buildSignRawOperation(signerContext),
    broadcast: wrappedBroadcast,
    assignFromAccountRaw,
    assignToAccountRaw,
    formatAccountSpecifics: formatters.formatAccountSpecifics,
    getSerializedAddressParameters,
    validateAddress,
    getFullViewingKey: getFullViewingKeyFromBridge,
  };
}

export function createBridges(signerContext: SignerContext, coinConfig: CoinConfig) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
