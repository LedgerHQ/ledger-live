import createTransaction from "../js-createTransaction";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import getTransactionStatus from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import signOperation from "../js-signOperation";
import { sync, scanAccounts } from "../js-synchronisation";
import updateTransaction from "../js-updateTransaction";
import type { CosmosValidatorItem, Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import {
  asSafeCosmosPreloadData,
  setCosmosPreloadData,
} from "../preloadedData";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { CosmosAPI } from "../api/Cosmos";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CosmosValidatorsManager } from "../CosmosValidatorsManager";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";

const receive = makeAccountBridgeReceive();

const getPreloadStrategy = (_currency) => ({
  preloadMaxAge: 30 * 1000,
});

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload: async (currency: CryptoCurrency) => {
    const cosmosValidatorsManager = new CosmosValidatorsManager(
      getCryptoCurrencyById(currency.id)
    );
    const validators = await cosmosValidatorsManager.getValidators();
    setCosmosPreloadData(currency.id, {
      validators,
    });
    return Promise.resolve({
      validators,
    });
  },
  hydrate: (
    data: { validators?: CosmosValidatorItem[] },
    currency: CryptoCurrency
  ) => {
    if (!data || typeof data !== "object") return;
    const { validators } = data;
    if (
      !validators ||
      typeof validators !== "object" ||
      !Array.isArray(validators)
    )
      return;
    const cosmosValidatorsManager = new CosmosValidatorsManager(
      getCryptoCurrencyById(currency.id)
    );
    cosmosValidatorsManager.hydrateValidators(validators);
    setCosmosPreloadData(currency.id, asSafeCosmosPreloadData(data));
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
  assignFromAccountRaw,
  assignToAccountRaw,
  broadcast: async ({ account, signedOperation }) => {
    return new CosmosAPI(account.currency.id).broadcast({
      signedOperation,
    });
  },
};

export default {
  currencyBridge,
  accountBridge,
};
