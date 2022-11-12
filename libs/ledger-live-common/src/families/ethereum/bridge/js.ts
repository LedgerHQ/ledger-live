import type { CurrencyBridge, AccountBridge } from "@ledgerhq/types-live";
import {
  makeSync,
  makeScanAccounts,
  makeAccountBridgeReceive,
} from "../../../bridge/jsHelpers";
import { nftMetadata, collectionMetadata } from "../nftResolvers";
import estimateMaxSpendable from "../estimateMaxSpendable";
import getTransactionStatus from "../getTransactionStatus";
import prepareTransaction from "../prepareTransaction";
import createTransaction from "../createTransaction";
import updateTransaction from "../updateTransaction";
import { getAccountShape } from "../synchronisation";
import { signOperation } from "../signOperation";
import { preload, hydrate } from "../modules";
import postSyncPatch from "../postSyncPatch";
import type { Transaction } from "../types";
import broadcast from "../broadcast";

const receive: AccountBridge<Transaction>["receive"] =
  makeAccountBridgeReceive();

const scanAccounts = makeScanAccounts({ getAccountShape });
const sync: AccountBridge<Transaction>["sync"] = makeSync({
  getAccountShape,
  postSync: postSyncPatch,
  shouldMergeOps: false,
});

const getPreloadStrategy = (): {} => ({
  preloadMaxAge: 30 * 1000,
});

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
  nftResolvers: {
    nftMetadata,
    collectionMetadata,
  },
};
const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  estimateMaxSpendable,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
};
export default {
  currencyBridge,
  accountBridge,
};
