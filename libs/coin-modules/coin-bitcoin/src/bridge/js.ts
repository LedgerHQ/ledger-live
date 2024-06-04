import { AccountBridge } from "@ledgerhq/types-live";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { StartSpan, makeGetAccountShape, postSync } from "../synchronisation";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { BitcoinAccount, Transaction, TransactionStatus } from "../types";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
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

function buildCurrencyBridge(signerContext: SignerContext, perfLogger: PerfLogger) {
  const getAddress = resolver(signerContext);
  const scanAccounts = makeScanAccounts<BitcoinAccount>({
    getAccountShape: makeGetAccountShape(signerContext, perfLogger.startSpan),
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    scanAccounts,
    preload: () => Promise.resolve({}),
    hydrate: () => {},
  };
}

function buildAccountBridge(signerContext: SignerContext, perfLogger: PerfLogger) {
  const sync = makeSync<Transaction, BitcoinAccount, TransactionStatus>({
    getAccountShape: makeGetAccountShape(signerContext, perfLogger.startSpan),
    postSync,
  });

  const getAddress = resolver(signerContext);
  const injectGetAddressParams = (account: BitcoinAccount): any => {
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
  }) => {
    calculateFees.reset();
    return broadcast({
      account,
      signedOperation,
    });
  };

  return {
    estimateMaxSpendable,
    createTransaction,
    prepareTransaction,
    updateTransaction,
    getTransactionStatus,
    receive,
    sync,
    signOperation: buildSignOperation(signerContext),
    broadcast: wrappedBroadcast,
    assignFromAccountRaw,
    assignToAccountRaw,
  };
}

export type PerfLogger = {
  startSpan: StartSpan;
};

export function createBridges(
  signerContext: SignerContext,
  perfLogger: PerfLogger,
  coinConfig: CoinConfig,
) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext, perfLogger),
    accountBridge: buildAccountBridge(signerContext, perfLogger),
  };
}
