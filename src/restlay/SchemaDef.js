//@flow
import * as Normalizr from "normalizr-gre";

export function create(
  collectionName: string,
  schema: *,
  idAttribute: string = "id"
) {
  const entity = new Normalizr.schema.Entity(collectionName, schema, {
    idAttribute
  });

  return entity;
}
