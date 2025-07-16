import BigNumber from "bignumber.js";
import { APTOS_NON_HARDENED_DERIVATION_PATH_REGEX } from "./families/aptos/consts";
import { getCurrencyConfiguration } from "./config";
import { findCryptoCurrencyById } from "./currencies";

/**
 * Interface for the end user.
 * @memberof DataModel
 */
export type DataModel<R, M> = {
  // R: Raw , M: Model
  // import a given version of rawData back into model
  decode(rawModel: { data: R; version: number }): M;
  // export data into a serializable object (can be saved to a JSON file)
  encode(model: M): {
    data: R;
    version: number;
  };
  // current version of the model
  version: number;
};

/**
 * this is to be implemented to create a DataModel
 * @memberof DataModel
 */
export type DataSchema<R, M> = {
  // write extra logic to transform raw data into your model
  decode(raw: R): M;
  // reverse version of wrap, that will transform it back to a serializable object
  encode(data: M): R;
  // A map of migrations functions that are unrolled when an old version is imported
  migrations: Array<(arg0: any) => R | any>;
};

/**
 * @memberof DataModel
 */
export function createDataModel<R, M>(schema: DataSchema<R, M>): DataModel<R, M> {
  const { migrations, encode, decode } = schema;
  const version = migrations.length;
  function decodeModel(raw) {
    let { data } = raw;
    const { currencyId, freshAddressPath } = data;
    const currency = findCryptoCurrencyById(currencyId);
    // Set 'change' and 'address_index' levels to be hardened for Aptos derivation path
    if (
      currencyId === "aptos" &&
      freshAddressPath.match(APTOS_NON_HARDENED_DERIVATION_PATH_REGEX)
    ) {
      data.freshAddressPath = freshAddressPath
        .split("/")
        .map(value => (value.endsWith("'") ? value : value + "'"))
        .join("/");
    }

    if (currencyId == "crypto_org" && !data.cosmosResources) {
      data.cosmosResources = {
        delegations: [],
        redelegations: [],
        unbondings: [],
        delegatedBalance: new BigNumber(0),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(0),
        withdrawAddress: data.freshAddress,
        sequence: 0,
      };
    }
    if (currency && currency.family == "evm" && !getCurrencyConfiguration(currency).showNfts) {
      if (Array.isArray(data.operations)) {
        data.operations = data.operations.filter(tx => !("nftOperations" in tx));
      }
    }

    for (let i = raw.version; i < version; i++) {
      data = migrations[i](data);
    }

    data = decode(data);
    return data;
  }

  function encodeModel(model) {
    const data = encode(model);
    return {
      data,
      version,
    };
  }

  return Object.freeze({
    version,
    decode: decodeModel,
    encode: encodeModel,
  });
}
