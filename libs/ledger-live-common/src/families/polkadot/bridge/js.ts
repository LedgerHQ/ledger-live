import type {
  AccountBridge,
  CurrencyBridge,
  Operation,
  SignedOperation,
} from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { patchOperationWithHash } from "../../../operation";
import { submitExtrinsic } from "../api";
import { getPreloadStrategy, preload, hydrate } from "../preload";
import { sync, scanAccounts } from "../js-synchronisation";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import { loadPolkadotCrypto } from "../polkadot-crypto";
const receive = makeAccountBridgeReceive();

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

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
};
const accountBridge: AccountBridge<Transaction> = {
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
export default {
  currencyBridge,
  accountBridge,
};
