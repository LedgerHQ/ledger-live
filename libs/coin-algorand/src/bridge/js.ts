import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  DeviceCommunication,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";

import { makeGetAccountShape } from "../js-synchronization";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import { estimateMaxSpendable } from "../js-estimateMaxSpendable";
import { getTransactionStatus } from "../js-getTransactionStatus";
import { buildSignOperation } from "../js-signOperation";
import { broadcast } from "../js-broadcast";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { initAccount } from "../initAccount";
import type { Transaction } from "../types";
import getAddress from "../hw-getAddress";
import { AlgorandAPI } from "../api";

const updateTransaction = (t: Transaction, patch: Partial<Transaction>) => ({
  ...t,
  ...patch,
});

export function buildCurrencyBridge(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall
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
  network: NetworkRequestCall
): AccountBridge<Transaction> {
  const algorandAPI = new AlgorandAPI(network);

  const receive = makeAccountBridgeReceive(
    getAddressWrapper(getAddress),
    deviceCommunication
  );
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

export function createBridges(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall
) {
  return {
    currencyBridge: buildCurrencyBridge(deviceCommunication, network),
    accountBridge: buildAccountBridge(deviceCommunication, network),
  };
}
