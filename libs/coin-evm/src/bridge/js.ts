import {
  DeviceCommunication,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { hydrate, preload } from "../preload";
import { prepareTransaction } from "../prepareTransaction";
import { buildSignOperation } from "../signOperation";
import { getAccountShape } from "../synchronization";
import type { Transaction as EvmTransaction } from "../types";
import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { LRUCacheFn } from "@ledgerhq/coin-framework/cache";
import type { Transaction } from "../types";
import { EvmAPI } from "../api";
import getAddress from "../hw-getAddress";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";

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
    getAccountShape,
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
  deviceCommunication: DeviceCommunication
): AccountBridge<Transaction> {
  const receive = makeAccountBridgeReceive(
    getAddressWrapper(getAddress),
    deviceCommunication
  );
  const signOperation = buildSignOperation(deviceCommunication);
  const sync = makeSync({ getAccountShape });

  return {
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    broadcast,
    estimateMaxSpendable,
  };
}

export function createBridges(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn
) {
  return {
    currencyBridge: buildCurrencyBridge(deviceCommunication, network, cacheFn),
    accountBridge: buildAccountBridge(deviceCommunication),
  };
}
