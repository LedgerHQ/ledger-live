import type {
  AccountBridge,
  CurrencyBridge,
  Operation,
  SignedOperation,
} from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import {
  DeviceCommunication,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { submitExtrinsic } from "../api";
import { getPreloadStrategy, preload, hydrate } from "../preload";
import { getAccountShape } from "../js-synchronisation";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import buildSignOperation from "../js-signOperation";
import getAddress from "../hw-getAddress";
import { loadPolkadotCrypto } from "../polkadot-crypto";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";

const updateTransaction = (t, patch) => ({ ...t, ...patch });

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast = async ({
  signedOperation: { signature, operation },
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  await loadPolkadotCrypto();
  const hash = await submitExtrinsic(signature);
  return patchOperationWithHash(operation, hash);
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
    getPreloadStrategy,
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
  const sync = makeSync({ getAccountShape });

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
  };
}
