/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import * as explorerConfigAPI from "../../../api/explorerConfig";
import { sync, scanAccounts } from "../js-synchronisation";
import { estimateMaxSpendable } from "../js-estimateMaxSpendable";
import {
  createTransaction,
  updateTransaction,
  prepareTransaction,
} from "../js-transaction";
import { getTransactionStatus } from "../js-getTransactionStatus";
import { signOperation } from "../js-signOperation";
import { broadcast } from "../js-broadcast";

const receive = makeAccountBridgeReceive();

const preload = async () => {
  const explorerConfig = await explorerConfigAPI.preload();
  return {
    explorerConfig,
  };
};

const hydrate = (maybeConfig: any) => {
  if (
    maybeConfig &&
    typeof maybeConfig === "object" &&
    maybeConfig.explorerConfig
  ) {
    explorerConfigAPI.hydrate(maybeConfig.explorerConfig);
  }
};

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload,
  hydrate,
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  signOperation,
  broadcast,
  sync,
  receive,
};

export default { currencyBridge, accountBridge };
