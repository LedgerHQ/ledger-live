import { getCurrencyConfiguration } from "./config";
import { findCryptoCurrencyById } from "./currencies";

/**
 * Interface for the end user.
 * @memberof DataModel
 */
export type DataModel<R, M> = {
  // R: Raw , M: Model
  // import a given version of rawData back into model
  decode(rawModel: { data: R; version: number }): Promise<M>;
  // export data into a serializable object (can be saved to a JSON file)
  encode(model: M): Promise<{
    data: R;
    version: number;
  }>;
  // current version of the model
  version: number;
};

/**
 * this is to be implemented to create a DataModel
 * @memberof DataModel
 *
 * IMPORTANT: This file must remain domain-agnostic. Do NOT add any account-specific,
 * coin-specific, or app-specific migration logic here. Such logic belongs in the
 * app-level accountModel (apps/ledger-live-desktop, apps/ledger-live-mobile).
 */
export type DataSchema<R, M> = {
  // write extra logic to transform raw data into your model
  decode(raw: R): Promise<M>;
  // reverse version of wrap, that will transform it back to a serializable object
  encode(data: M): R | Promise<R>;
  // A map of migrations functions that are unrolled when an old version is imported
  migrations: Array<(arg0: any) => R | any>;
};

/**
 * @memberof DataModel
 */
export function createDataModel<R, M>(schema: DataSchema<R, M>): DataModel<R, M> {
  const { migrations, encode, decode } = schema;
  const version = migrations.length;
  async function decodeModel(raw) {
    let { data } = raw;
    const currency = findCryptoCurrencyById(data.currencyId);
    if (currency && currency.family == "evm" && !getCurrencyConfiguration(currency.id).showNfts) {
      if (Array.isArray(data.operations)) {
        data.operations = data.operations.filter(tx => !("nftOperations" in tx));
      }
    }

    for (let i = raw.version; i < version; i++) {
      data = migrations[i](data);
    }

    data = await decode(data);
    return data;
  }

  async function encodeModel(model) {
    const data = await encode(model);
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
