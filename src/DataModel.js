//@flow
import invariant from "invariant";

// Interface for the end user.
export type DataModel<R, M> = {
  // R: Raw , M: Model
  // import a given version of rawData back into model
  decode(rawModel: { data: R, version: number }): { data: M, version: number },
  // export data into a serializable object (can be saved to a JSON file)
  encode(model: { data: M, version: number }): { data: R, version: number }
};

// this is to be implemented to create a DataModel
export type DataSchema<R, M> = {
  // write extra logic to transform raw data into your model
  wrap(raw: R): M,
  // reverse version of wrap, that will transform it back to a serializable object
  unwrap(data: M): R,
  // Define the current version of the schema
  version: number,
  // A map of migrations functions that are unrolled when an old version is imported
  migrations: {
    [key: number]: (any) => R | any
  }
};

export function createDataModel<R, M>({
  version,
  migrations,
  unwrap,
  wrap
}: DataSchema<R, M>): DataModel<R, M> {
  function decode(raw) {
    let data = raw.data;
    for (let i = raw.version; i < version; i++) {
      // we need to migrate for entering version (i+1)
      const newVersion = i + 1;
      if (newVersion in migrations) {
        data = migrations[newVersion](data);
      }
    }
    data = wrap(data);
    return { data, version };
  }
  function encode(model) {
    invariant(
      model.version === version,
      "encode can only works with latest version of the model"
    );
    const data = unwrap(model.data);
    return { data, version };
  }
  return Object.freeze({ decode, encode });
}
