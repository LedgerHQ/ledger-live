import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
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
import resolver from "../hw-getAddress";
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
import { PolkadotSigner, SignerFactory } from "../signer";

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
  signerFactory: SignerFactory,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn,
): CurrencyBridge {
  const polkadotAPI = new PolkadotAPI(network, cacheFn);
  const getAddress = resolver(signerFactory);

  const getAccountShape = makeGetAccountShape(polkadotAPI);
  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    getPreloadStrategy,
    preload: preload(polkadotAPI),
    hydrate,
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerFactory: SignerFactory,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn,
): AccountBridge<Transaction> {
  const polkadotAPI = new PolkadotAPI(network, cacheFn);
  const getAddress = resolver(signerFactory);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerFactory, polkadotAPI);
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
  signerFactory: SignerFactory,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerFactory, network, cacheFn),
    accountBridge: buildAccountBridge(signerFactory, network, cacheFn),
  };
}
