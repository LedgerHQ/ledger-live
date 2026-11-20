import { z } from "zod";
import type { RecordDefinition } from "../RecordDefinition";

export function storedSchemaSnapshot<State, Action>(definition: RecordDefinition<State, Action>) {
  if (definition.kind === "collection") {
    return {
      key: definition.key,
      version: definition.version,
      entrySchema: z.toJSONSchema(definition.entrySchema),
    };
  }
  return {
    key: definition.key,
    version: definition.version,
    schema: z.toJSONSchema(definition.schema),
  };
}
