import { z } from "zod";
import type { RecordDefinition } from "../RecordDefinition";

export function storedSchemaSnapshot<State, Action>(
  definition: RecordDefinition<State, Action>,
  version: number,
) {
  const schema = definition.storedSchemas[version];
  if (schema === undefined) {
    throw new RangeError(`Record "${definition.key}" has no version ${version}`);
  }
  return { key: definition.key, version, schema: z.toJSONSchema(schema, { io: "input" }) };
}
