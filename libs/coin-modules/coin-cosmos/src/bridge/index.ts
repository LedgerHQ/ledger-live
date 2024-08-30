import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";

import { CosmosValidatorsManager } from "../CosmosValidatorsManager";
import { CosmosAPI } from "../api/Cosmos";
import cryptoFactory from "../chain/chain";
import { CoinConfig, getCoinConfig, setCoinConfig } from "../config";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import getTransactionStatus from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { asSafeCosmosPreloadData, setCosmosPreloadData } from "../preloadedData";
import { prepareTransaction } from "../prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";
import { buildSignOperation } from "../signOperation";
import { getAccountShape } from "../synchronisation";
import type {
  CosmosAccount,
  CosmosCurrencyConfig,
  CosmosValidatorItem,
  Transaction,
  TransactionStatus,
} from "../types";
import { CosmosSigner } from "../types/signer";
import { updateTransaction } from "../updateTransaction";

const sync = makeSync({ getAccountShape });

function buildCurrencyBridge(signerContext: SignerContext<CosmosSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  const getPreloadStrategy = () => ({
    preloadMaxAge: 30 * 1000,
  });

  return {
    getPreloadStrategy,
    preload: async (currency: CryptoCurrency) => {
      const config = getCoinConfig(currency);
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
      relatedImpl.ledgerValidator = data.config?.ledgerValidator;
      const { validators } = data;
      if (!validators || typeof validators !== "object" || !Array.isArray(validators)) return;
      const cosmosValidatorsManager = new CosmosValidatorsManager(
        getCryptoCurrencyById(currency.id),
      );
      cosmosValidatorsManager.hydrateValidators(validators);
      setCosmosPreloadData(currency.id, asSafeCosmosPreloadData(data));
    },
    scanAccounts,
  };
}

function buildAccountBridge(
  signerContext: SignerContext<CosmosSigner>,
): AccountBridge<Transaction, CosmosAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);
  // const getAddress = signerGetAddress(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
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
}

export function createBridges(signerContext: SignerContext<CosmosSigner>, coinConfig: CoinConfig) {
  setCoinConfig(coinConfig);
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
