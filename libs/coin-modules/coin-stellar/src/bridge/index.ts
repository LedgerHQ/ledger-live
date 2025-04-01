import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import stellarCoinConfig, { type StellarCoinConfig } from "../config";
import signerGetAddress from "../signer";
import type { StellarSigner, Transaction, TransactionRaw, TransactionStatus } from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { getAccountShape } from "./synchronization";
import serialization from "./transaction";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

function buildCurrencyBridge(signerContext: SignerContext<StellarSigner>): CurrencyBridge {
  const getAddress = signerGetAddress(signerContext);

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

function buildAccountBridge(
  signerContext: SignerContext<StellarSigner>,
): AccountBridge<Transaction, Account, TransactionStatus, TransactionRaw> {
  const getAddress = signerGetAddress(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });

  return {
    createTransaction,
    updateTransaction,
    prepareTransaction,
    estimateMaxSpendable,
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    broadcast,
    getSerializedAddressParameters,
    ...serialization,
  };
}

export type StellarBridge = Bridge<Transaction, Account, TransactionStatus, TransactionRaw>;

export function createBridges(
  signerContext: SignerContext<StellarSigner>,
  coinConfig: CoinConfig<StellarCoinConfig>,
): StellarBridge {
  stellarCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
