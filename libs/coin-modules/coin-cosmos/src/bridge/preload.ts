import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import { CosmosValidatorsManager } from "../CosmosValidatorsManager";
import cryptoFactory from "../chain/chain";
import { getCoinConfig } from "../config";
import { asSafeCosmosPreloadData, setCosmosPreloadData } from "../preloadedData";
import type { CosmosCurrencyConfig, CosmosValidatorItem } from "../types";

export const getPreloadStrategy = () => ({
  preloadMaxAge: 30 * 1000,
});

export const preload = async (currency: CryptoCurrency) => {
  const config = getCoinConfig(currency);
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

// export const preload = async () => {
//   const superRepresentatives = await getTronSuperRepresentatives();
//   return {
//     superRepresentatives,
//   };
// };

export const hydrate = (
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
  const cosmosValidatorsManager = new CosmosValidatorsManager(getCryptoCurrencyById(currency.id));
  cosmosValidatorsManager.hydrateValidators(validators);
  setCosmosPreloadData(currency.id, asSafeCosmosPreloadData(data));
};

// export const hydrate = (data?: { superRepresentatives?: SuperRepresentative[] }) => {
//   if (!data || !data.superRepresentatives) return;

//   const { superRepresentatives } = data;

//   if (
//     !superRepresentatives ||
//     typeof superRepresentatives !== "object" ||
//     !Array.isArray(superRepresentatives)
//   )
//     return;

//   hydrateSuperRepresentatives(superRepresentatives);
// };

// export c
