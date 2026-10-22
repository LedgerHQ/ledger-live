import { z } from "zod";
import { DuplicateConfigValueError } from "./errors";
import type { ConfigSchema, ConfigSchemaSwitches, Zod } from "./types";
import type { ValuesShape } from "./types.internals";

/**
 * Declares, with zod, the value schemas of each switch and of the fixed values. A value name must be
 * unique across all of them.
 */
export function defineConfigSchema<
  Switches extends ConfigSchemaSwitches,
  Fixed extends z.ZodRawShape,
>(
  define: (zod: Zod) => { readonly switches: Switches; readonly fixed: Fixed },
): ConfigSchema<Switches, Fixed> {
  const { switches, fixed } = define(z);
  const shapes: readonly z.ZodRawShape[] = [...Object.values(switches), fixed];
  assertUniqueNames(shapes);
  const valuesShape: ValuesShape<Switches, Fixed> = Object.assign({}, ...shapes);
  return { switches, fixed, values: z.strictObject(valuesShape) };
}

function assertUniqueNames(shapes: readonly z.ZodRawShape[]): void {
  const names = new Set<string>();
  for (const name of shapes.flatMap(shape => Object.keys(shape))) {
    if (names.has(name)) throw new DuplicateConfigValueError(name);
    names.add(name);
  }
}
