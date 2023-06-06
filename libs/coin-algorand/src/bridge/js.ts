import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerFactory } from "@ledgerhq/coin-framework/signer";
import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";

import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { AlgorandAPI } from "../api";
import resolver from "../hw-getAddress";
import { initAccount } from "../initAccount";
import { broadcast } from "../js-broadcast";
import createTransaction from "../js-createTransaction";
import { estimateMaxSpendable } from "../js-estimateMaxSpendable";
import { getTransactionStatus } from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import { buildSignOperation } from "../js-signOperation";
import { makeGetAccountShape } from "../js-synchronization";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import type { Transaction } from "../types";
import { AlgorandSigner } from "../signer";

const updateTransaction = (t: Transaction, patch: Partial<Transaction>) => ({
  ...t,
  ...patch,
});

export function buildCurrencyBridge(
  signerFactory: SignerFactory<AlgorandSigner>,
  network: NetworkRequestCall,
): CurrencyBridge {
  const algorandAPI = new AlgorandAPI(network);
  const getAddress = resolver(signerFactory);

  const getAccountShape = makeGetAccountShape(algorandAPI);
  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerFactory: SignerFactory<AlgorandSigner>,
  network: NetworkRequestCall,
): AccountBridge<Transaction> {
  const algorandAPI = new AlgorandAPI(network);
  const getAddress = resolver(signerFactory);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerFactory, algorandAPI);
  const getAccountShape = makeGetAccountShape(algorandAPI);
  const sync = makeSync({ getAccountShape });

  return {
    createTransaction,
    updateTransaction,
    prepareTransaction: prepareTransaction(algorandAPI),
    getTransactionStatus: getTransactionStatus(algorandAPI),
    sync,
    receive,
    assignToAccountRaw,
    assignFromAccountRaw,
    initAccount,
    signOperation,
    broadcast: broadcast(algorandAPI),
    estimateMaxSpendable: estimateMaxSpendable(algorandAPI),
  };
}

/**
 * FIXME: an unsued cacheFn is passed to createBridges because of how the
 * libs/ledger-live-common/scripts/sync-families-dispatch.mjs script works.
 */
export function createBridges(
  signerFactory: SignerFactory<AlgorandSigner>,
  network: NetworkRequestCall,
  _cacheFn: unknown,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerFactory, network),
    accountBridge: buildAccountBridge(signerFactory, network),
  };
}
