import BigNumber from "bignumber.js";

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

    if (data.currencyId == "crypto_org_cosmos" && !data.cosmosResources) {
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
