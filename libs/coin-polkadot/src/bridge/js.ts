import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  DeviceCommunication,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type {
  AccountBridge,
  CurrencyBridge,
  Operation,
  SignedOperation,
} from "@ledgerhq/types-live";
import { PolkadotAPI } from "../api";
import getAddress from "../hw-getAddress";
import createTransaction from "../js-createTransaction";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import getTransactionStatus from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import buildSignOperation from "../js-signOperation";
import { makeGetAccountShape } from "../js-synchronisation";
import { loadPolkadotCrypto } from "../polkadot-crypto";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { getPreloadStrategy, hydrate, preload } from "../preload";
import type { Transaction } from "../types";
import { LRUCacheFn } from "@ledgerhq/coin-framework/cache";

const updateTransaction = (t: Transaction, patch: Partial<Transaction>) => ({
  ...t,
  ...patch,
});

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast =
  (polkadotAPI: PolkadotAPI) =>
  async ({
    signedOperation: { signature, operation },
  }: {
    signedOperation: SignedOperation;
  }): Promise<Operation> => {
    await loadPolkadotCrypto();
    const hash = await polkadotAPI.submitExtrinsic(signature);
    return patchOperationWithHash(operation, hash);
  };

export function buildCurrencyBridge(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn
): CurrencyBridge {
  const polkadotAPI = new PolkadotAPI(network, cacheFn);

  const getAccountShape = makeGetAccountShape(polkadotAPI);
  const scanAccounts = makeScanAccounts({
    getAccountShape,
    deviceCommunication,
    getAddressFn: getAddress,
  });

  return {
    getPreloadStrategy,
    preload: preload(polkadotAPI),
    hydrate,
    scanAccounts,
  };
}

export function buildAccountBridge(
  deviceCommunication: DeviceCommunication,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn
): AccountBridge<Transaction> {
  const polkadotAPI = new PolkadotAPI(network, cacheFn);

  const receive = makeAccountBridgeReceive(
    getAddressWrapper(getAddress),
    deviceCommunication
  );
  const signOperation = buildSignOperation(deviceCommunication, polkadotAPI);
  const getAccountShape = makeGetAccountShape(polkadotAPI);
  const sync = makeSync({ getAccountShape });

  return {
    estimateMaxSpendable: estimateMaxSpendable(polkadotAPI),
    createTransaction,
    updateTransaction,
    getTransactionStatus: getTransactionStatus(polkadotAPI),
    prepareTransaction: prepareTransaction(polkadotAPI),
    sync,
    receive,
    signOperation,
    broadcast: broadcast(polkadotAPI),
    assignFromAccountRaw,
    assignToAccountRaw,
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
