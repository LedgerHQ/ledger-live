import type { z } from "zod";
import type { ValuesShape } from "./types.internals";

/** The zod namespace `defineConfigSchema` hands to its callback. */
export type Zod = typeof z;

export type ConfigStorage = {
  readonly getAll: () => unknown;
  readonly set: (key: string, value: ConfigOptionId) => void;
  readonly clear: () => void;
};

/** The value schemas of each switch, by switch id. Every option of a switch has that shape. */
export type ConfigSchemaSwitches = Readonly<Record<string, z.ZodRawShape>>;

/** The schema `defineConfigSchema` returns. */
export type ConfigSchema<Switches extends ConfigSchemaSwitches, Fixed extends z.ZodRawShape> = {
  readonly switches: Switches;
  readonly fixed: Fixed;
  /** Every configuration value, from the switches and the fixed values, rejecting any other. */
  readonly values: ReturnType<typeof z.strictObject<ValuesShape<Switches, Fixed>>>;
};

/** The id of an option. Every switch declares one option per id. */
export type ConfigOptionId = "prod" | "staging";

/** The options of a switch whose values have this shape, by option id. */
export type ConfigOptions<Shape extends z.ZodRawShape> = Readonly<
  Record<ConfigOptionId, z.input<z.ZodObject<Shape, z.core.$strict>>>
>;

/**
 * A closed set of option groups that the build declares. Selecting another option moves all its
 * values together, and never accepts a value the build did not declare.
 */
export type ConfigSwitch<Options extends Readonly<Record<ConfigOptionId, unknown>>> = {
  readonly label: string;
  readonly options: Options;
};

/** The configuration a schema describes, as `resolveAppConfig` returns it. */
export type AppConfig<Schema extends ConfigSchema<ConfigSchemaSwitches, z.ZodRawShape>> = Readonly<
  z.output<Schema["values"]>
>;
