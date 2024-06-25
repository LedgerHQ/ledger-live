import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import type { Transaction, TransactionStatus } from "../types";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import { broadcast } from "../broadcast";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import resolver from "../hw-getAddress";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import Stellar from "@ledgerhq/hw-app-str";
import { getAccountShape } from "../getAccountShape";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { StellarCoinConfig, setCoinConfig } from "../config";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

function buildCurrencyBridge(signerContext: SignerContext<Stellar>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  function getPreloadStrategy() {
    return {
      preloadMaxAge: PRELOAD_MAX_AGE,
    };
  }

  return {
    getPreloadStrategy,
    preload: async () => {},
    hydrate: () => {},
    scanAccounts,
  };
}

function buildAccountBridge(signerContext: SignerContext<Stellar>) {
  const getAddress = resolver(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });

  const accountBridge: AccountBridge<Transaction, Account, TransactionStatus> = {
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
    prepareTransaction,
    estimateMaxSpendable,
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    broadcast,
  };

  return accountBridge;
}

export function createBridges(
  signerContext: SignerContext<Stellar>,
  coinConfig: CoinConfig<StellarCoinConfig>,
) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
