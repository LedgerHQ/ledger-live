import { z } from "zod";
import { DuplicateConfigIdError, DuplicateConfigValueError } from "./errors";
import type { ConfigSchema, ConfigSchemaSwitches, Zod } from "./types";
import { optionIdSchema } from "./internals/options";
import type { ValuesShape } from "./internals/types";

/** The id of each option every switch declares, in display order. */
export const APP_CONFIG_OPTION_IDS = optionIdSchema.options;

/**
 * Declares, with zod, the value schemas of each switch and of the fixed values. A value name must be
 * unique across all of them, and a switch id must not be the name of a fixed value.
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
  assertDistinctIds(switches, fixed);
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

function assertDistinctIds(switches: ConfigSchemaSwitches, fixed: z.ZodRawShape): void {
  const clash = Object.keys(switches).find(switchId => Object.hasOwn(fixed, switchId));
  if (clash !== undefined) throw new DuplicateConfigIdError(clash);
}
