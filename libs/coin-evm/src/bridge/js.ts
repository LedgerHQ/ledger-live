import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  DeviceCommunication,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { LRUCacheFn } from "@ledgerhq/coin-framework/cache";
import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { EvmAPI } from "../api";
import { broadcast } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import getAddress from "../hw-getAddress";
import { hydrate, preload } from "../preload";
import { prepareTransaction } from "../prepareTransaction";
import { buildSignOperation } from "../signOperation";
import { makeGetAccountShape } from "../synchronization";
import type { Transaction as EvmTransaction, Transaction } from "../types";

const updateTransaction: AccountBridge<EvmTransaction>["updateTransaction"] = (
  transaction,
  patch
) => {
  return { ...transaction, ...patch } as EvmTransaction;
};

export function buildCurrencyBridge(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn
): CurrencyBridge {
  const evmAPI = new EvmAPI(network, cacheFn);

  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(evmAPI),
    deviceCommunication,
    getAddressFn: getAddress,
  });

  return {
    preload: preload(evmAPI),
    hydrate,
    scanAccounts,
  };
}

export function buildAccountBridge(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn
): AccountBridge<Transaction> {
  const evmAPI = new EvmAPI(network, cacheFn);

  const receive = makeAccountBridgeReceive(
    getAddressWrapper(getAddress),
    deviceCommunication
  );
  const signOperation = buildSignOperation(deviceCommunication);
  const getAccountShape = makeGetAccountShape(evmAPI);
  const sync = makeSync({ getAccountShape });

  return {
    createTransaction,
    updateTransaction,
    prepareTransaction: prepareTransaction(evmAPI),
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    broadcast,
    estimateMaxSpendable: estimateMaxSpendable(evmAPI),
  };
}

export function createBridges(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn
) {
  return {
    currencyBridge: buildCurrencyBridge(deviceCommunication, network, cacheFn),
    accountBridge: buildAccountBridge(deviceCommunication, network, cacheFn),
  };
}
