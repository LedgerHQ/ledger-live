/**
 * @flow
 * @module DataModel
 */

/**
 * Interface for the end user.
 * @memberof DataModel
 */
export type DataModel<R, M> = {
  // R: Raw , M: Model
  // import a given version of rawData back into model
  decode(rawModel: { data: R, version: number }): M,
  // export data into a serializable object (can be saved to a JSON file)
  encode(model: M): { data: R, version: number },
  // current version of the model
  version: number,
}

/**
 * this is to be implemented to create a DataModel
 * @memberof DataModel
 */
export type DataSchema<R, M> = {
  // write extra logic to transform raw data into your model
  wrap(raw: R): M,
  // reverse version of wrap, that will transform it back to a serializable object
  unwrap(data: M): R,
  // A map of migrations functions that are unrolled when an old version is imported
  migrations: Array<(any) => R | any>,
}

/**
 * @memberof DataModel
 */
export function createDataModel<R, M>(schema: DataSchema<R, M>): DataModel<R, M> {
  const { migrations, unwrap, wrap } = schema
  const version = migrations.length
  function decode(raw) {
    let data = raw.data
    for (let i = raw.version; i < version; i++) {
      // we need to migrate for entering version (i+1)
      const newVersion = i + 1
      if (newVersion in migrations) {
        data = migrations[newVersion](data)
      }
    }
    data = wrap(data)
    return data
  }
  function encode(model) {
    const data = unwrap(model)
    return { data, version }
  }
  return Object.freeze({ version, decode, encode })
}
