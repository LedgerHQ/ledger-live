import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  DeviceCommunication,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";

import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { AlgorandAPI } from "../api";
import getAddress from "../hw-getAddress";
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

const updateTransaction = (t: Transaction, patch: Partial<Transaction>) => ({
  ...t,
  ...patch,
});

export function buildCurrencyBridge(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
): CurrencyBridge {
  const algorandAPI = new AlgorandAPI(network);

  const getAccountShape = makeGetAccountShape(algorandAPI);
  const scanAccounts = makeScanAccounts({
    getAccountShape,
    deviceCommunication,
    getAddressFn: getAddress,
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

export function buildAccountBridge(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
): AccountBridge<Transaction> {
  const algorandAPI = new AlgorandAPI(network);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress), deviceCommunication);
  const signOperation = buildSignOperation(deviceCommunication, algorandAPI);
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
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
  _cacheFn: unknown,
) {
  return {
    currencyBridge: buildCurrencyBridge(deviceCommunication, network),
    accountBridge: buildAccountBridge(deviceCommunication, network),
  };
}
