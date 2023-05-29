import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  DeviceCommunication,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import getAddress from "../hw-getAddress";
import { hydrate, preload } from "../preload";
import { prepareTransaction } from "../prepareTransaction";
import { buildSignOperation } from "../signOperation";
import { getAccountShape, sync } from "../synchronization";
import type { Transaction as EvmTransaction, Transaction } from "../types";

const updateTransaction: AccountBridge<EvmTransaction>["updateTransaction"] = (
  transaction,
  patch
) => {
  return { ...transaction, ...patch } as EvmTransaction;
};

export function buildCurrencyBridge(
  deviceCommunication: DeviceCommunication
): CurrencyBridge {
  const scanAccounts = makeScanAccounts({
    getAccountShape,
    deviceCommunication,
    getAddressFn: getAddress,
  });

  return {
    preload,
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

export function createBridges(deviceCommunication: DeviceCommunication) {
  return {
    currencyBridge: buildCurrencyBridge(deviceCommunication),
    accountBridge: buildAccountBridge(deviceCommunication),
  };
}
