import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { LRUCacheFn } from "@ledgerhq/coin-framework/cache";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  AccountBridge,
  CurrencyBridge,
  Operation,
  SignedOperation,
} from "@ledgerhq/types-live";
import { PolkadotAPI } from "./api";
import resolver from "./bridge/hw-getAddress";
import createTransaction from "./bridge/createTransaction";
import estimateMaxSpendable from "./bridge/estimateMaxSpendable";
import getTransactionStatus from "./bridge/getTransactionStatus";
import prepareTransaction from "./bridge/prepareTransaction";
import buildSignOperation from "./bridge/signOperation";
import { makeGetAccountShape } from "./bridge/synchronisation";
import { loadPolkadotCrypto } from "./bridge/polkadot-crypto";
import { assignFromAccountRaw, assignToAccountRaw } from "./bridge/serialization";
import { getPreloadStrategy, hydrate, preload } from "./bridge/preload";
import type { Transaction } from "./types";
import { PolkadotAddress, PolkadotSignature, PolkadotSigner } from "./types/signer";

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
  signerContext: SignerContext<PolkadotSigner, PolkadotAddress | PolkadotSignature>,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn,
): CurrencyBridge {
  const polkadotAPI = new PolkadotAPI(network, cacheFn);
  const getAddress = resolver(signerContext);

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
  signerContext: SignerContext<PolkadotSigner, PolkadotAddress | PolkadotSignature>,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn,
): AccountBridge<Transaction> {
  const polkadotAPI = new PolkadotAPI(network, cacheFn);
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext, polkadotAPI);
  const getAccountShape = makeGetAccountShape(polkadotAPI);
  const sync = makeSync({ getAccountShape });

  return {
    estimateMaxSpendable: estimateMaxSpendable(polkadotAPI),
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
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
  signerContext: SignerContext<PolkadotSigner, PolkadotAddress | PolkadotSignature>,
  network: NetworkRequestCall,
  cacheFn: LRUCacheFn,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext, network, cacheFn),
    accountBridge: buildAccountBridge(signerContext, network, cacheFn),
  };
}
