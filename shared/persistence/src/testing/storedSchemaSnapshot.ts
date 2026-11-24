import { z } from "zod";
import type { RecordDefinition } from "../RecordDefinition";

/** The stored JSON schema of 1 version of a record, for a snapshot test. */
export function storedSchemaSnapshot<State, Action>(
  definition: RecordDefinition<State, Action>,
  version: number,
) {
  const schema = definition.storedSchemas[version];
  if (schema === undefined) {
    throw new RangeError(`Record "${definition.key}" has no version ${version}`);
  }
  const jsonSchema = z.toJSONSchema(schema);
  return definition.kind === "collection"
    ? { key: definition.key, version, entrySchema: jsonSchema }
    : { key: definition.key, version, schema: jsonSchema };
}
