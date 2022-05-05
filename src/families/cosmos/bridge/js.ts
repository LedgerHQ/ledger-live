import createTransaction from "../js-createTransaction";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import getTransactionStatus from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import signOperation from "../js-signOperation";
import { sync, scanAccounts } from "../js-synchronisation";
import updateTransaction from "../js-updateTransaction";
import { AccountBridge, CurrencyBridge, CryptoCurrency } from "../../../types";
import type { CosmosValidatorItem, Transaction } from "../types";
import { getValidators, hydrateValidators } from "../validators";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { broadcast } from "../api/Cosmos";
import {
  asSafeCosmosPreloadData,
  setCosmosPreloadData,
} from "../preloadedData";

const receive = makeAccountBridgeReceive();

const getPreloadStrategy = (_currency) => ({
  preloadMaxAge: 30 * 1000,
});

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload: async (currency: CryptoCurrency) => {
    const validators = await getValidators(currency);
    setCosmosPreloadData({
      validators,
    });
    return Promise.resolve({
      validators,
    });
  },
  hydrate: (data: { validators?: CosmosValidatorItem[] }) => {
    if (!data || typeof data !== "object") return;
    const { validators } = data;
    if (
      !validators ||
      typeof validators !== "object" ||
      !Array.isArray(validators)
    )
      return;
    hydrateValidators(validators);
    setCosmosPreloadData(asSafeCosmosPreloadData(data));
  },
  scanAccounts,
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
