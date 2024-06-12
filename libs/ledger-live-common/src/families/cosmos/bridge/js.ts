import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type {
  CosmosAccount,
  CosmosCurrencyConfig,
  CosmosValidatorItem,
  Transaction,
  TransactionStatus,
} from "../types";
import { asSafeCosmosPreloadData, setCosmosPreloadData } from "../preloadedData";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { CosmosValidatorsManager } from "../CosmosValidatorsManager";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import getTransactionStatus from "../getTransactionStatus";
import { getCurrencyConfiguration } from "../../../config";
import { prepareTransaction } from "../prepareTransaction";
import { updateTransaction } from "../updateTransaction";
import { createTransaction } from "../createTransaction";
import { sync, scanAccounts } from "../synchronisation";
import { signOperation } from "../signOperation";
import cryptoFactory from "../chain/chain";
import { CosmosAPI } from "../api/Cosmos";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";

const receive = makeAccountBridgeReceive();

const getPreloadStrategy = _currency => ({
  preloadMaxAge: 30 * 1000,
});

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload: async (currency: CryptoCurrency) => {
    const config = getCurrencyConfiguration(currency);
    const cosmosValidatorsManager = new CosmosValidatorsManager(
      getCryptoCurrencyById(currency.id),
      { endPoint: (config as unknown as CosmosCurrencyConfig).lcd },
    );
    const validators = await cosmosValidatorsManager.getValidators();
    setCosmosPreloadData(currency.id, {
      validators,
    });

    return Promise.resolve({
      validators,
      config,
    });
  },
  hydrate: (
    data: { validators?: CosmosValidatorItem[]; config: CosmosCurrencyConfig },
    currency: CryptoCurrency,
  ) => {
    if (!data || typeof data !== "object") return;
    const relatedImpl = cryptoFactory(currency.id);
    relatedImpl.lcd = data.config.lcd;
    relatedImpl.minGasPrice = data.config.minGasPrice;
    relatedImpl.ledgerValidator = data.config.ledgerValidator;
    const { validators } = data;
    if (!validators || typeof validators !== "object" || !Array.isArray(validators)) return;
    const cosmosValidatorsManager = new CosmosValidatorsManager(getCryptoCurrencyById(currency.id));
    cosmosValidatorsManager.hydrateValidators(validators);
    setCosmosPreloadData(currency.id, asSafeCosmosPreloadData(data));
  },
  scanAccounts,
};

const accountBridge: AccountBridge<Transaction, CosmosAccount, TransactionStatus> = {
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
  fromOperationExtraRaw,
  toOperationExtraRaw,
};

export default {
  currencyBridge,
  accountBridge,
};
