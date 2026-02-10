import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import { CosmosValidatorsManager } from "../CosmosValidatorsManager";
import cryptoFactory from "../chain/chain";
import cosmosCoinConfig from "../config";
import { asSafeCosmosPreloadData, setCosmosPreloadData } from "../preloadedData";
import type { CosmosCurrencyConfig, CosmosValidatorItem } from "../types";

export const getPreloadStrategy = () => ({
  preloadMaxAge: 30 * 1000,
});

export const preload = async (currency: CryptoCurrency) => {
  const config = cosmosCoinConfig.getCoinConfig(currency);
  const cosmosValidatorsManager = new CosmosValidatorsManager(getCryptoCurrencyById(currency.id), {
    endPoint: (config as unknown as CosmosCurrencyConfig).lcd,
  });
  const validators = await cosmosValidatorsManager.getValidators();
  setCosmosPreloadData(currency.id, {
    validators,
  });

  return Promise.resolve({
    validators,
    config,
  });
};

export const hydrate = (
  data: { validators?: CosmosValidatorItem[]; config: CosmosCurrencyConfig },
  currency: CryptoCurrency,
) => {
  if (!data || typeof data !== "object") return;
  const { config, validators } = data;

  if (!config || typeof config !== "object" || !config.lcd || !config.minGasPrice) return;
  const relatedImpl = cryptoFactory(currency.id);
  relatedImpl.lcd = config.lcd;
  relatedImpl.minGasPrice = config.minGasPrice;
  relatedImpl.ledgerValidator = config?.ledgerValidator;

  if (!validators || typeof validators !== "object" || !Array.isArray(validators)) return;
  const cosmosValidatorsManager = new CosmosValidatorsManager(getCryptoCurrencyById(currency.id));
  cosmosValidatorsManager.hydrateValidators(validators);
  setCosmosPreloadData(currency.id, asSafeCosmosPreloadData(data));
};
