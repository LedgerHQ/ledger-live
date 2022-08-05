import type { Transaction } from "../types";
import { sync, scanAccounts } from "../js-synchronisation";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { calculateFees } from "./../cache";
import { perCoinLogic } from "../logic";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import * as explorerConfigAPI from "../../../api/explorerConfig";
import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";

const receive = makeAccountBridgeReceive({
  injectGetAddressParams: (account) => {
    const perCoin = perCoinLogic[account.currency.id];

    if (perCoin && perCoin.injectGetAddressParams) {
      return perCoin.injectGetAddressParams(account);
    }
  },
});

const updateTransaction = (t, patch) => {
  const updatedT = { ...t, ...patch };

  // We accept case-insensitive addresses as input from user,
  // but segwit addresses need to be converted to lowercase to be valid
  if (updatedT.recipient.toLowerCase().indexOf("bc1") === 0) {
    updatedT.recipient = updatedT.recipient.toLowerCase();
  }

  return updatedT;
};

const preload = async () => {
  const explorerConfig = await explorerConfigAPI.preload();
  return {
    explorerConfig,
  };
};

const hydrate = (maybeConfig: any) => {
  if (
    typeof maybeConfig === "object" &&
    maybeConfig &&
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
  prepareTransaction,
  updateTransaction,
  getTransactionStatus,
  receive,
  sync,
  signOperation,
  broadcast: async ({ account, signedOperation }) => {
    calculateFees.reset();
    return broadcast({
      account,
      signedOperation,
    });
  },
};
export default {
  currencyBridge,
  accountBridge,
};
