import type { z } from "zod";
import type { ValuesShape } from "./internals/types";

/** The zod namespace `defineConfigSchema` hands to its callback. */
export type Zod = typeof z;

export type ConfigStorage = {
  readonly getAll: () => unknown;
  readonly set: (key: string, value: ConfigOptionId) => void;
  /** Removes the selection of one switch, which then resolves to the default. */
  readonly remove: (key: string) => void;
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

/** The switches an app declares, by switch id, whatever the shape of their values. */
export type ConfigSwitches = Readonly<
  Record<string, ConfigSwitch<Readonly<Record<ConfigOptionId, Readonly<Record<string, unknown>>>>>>
>;

/** What the configuration of a session was resolved from, as `resolveAppConfig` returns it. */
export type AppConfigSession = {
  readonly switches: ConfigSwitches;
  /** The option of every switch without a valid selection. It depends on the build. */
  readonly default: ConfigOptionId;
  /** The option id saved for each switch, as read at boot. */
  readonly selections: Readonly<Record<string, ConfigOptionId>>;
  readonly storage: ConfigStorage;
};

/** The `appConfig` slice. */
export type AppConfigState = {
  /**
   * What the configuration of this session was resolved from, without its storage. `null` until
   * `createAppConfigMiddleware` sets it, right after the store is created.
   */
  readonly session: Omit<AppConfigSession, "storage"> | null;
  /** The option id saved for each switch, which the next session resolves from. */
  readonly savedSelections: Readonly<Record<string, ConfigOptionId>>;
};

/** The configuration a schema describes, as `resolveAppConfig` returns it. */
export type AppConfig<Schema extends ConfigSchema<ConfigSchemaSwitches, z.ZodRawShape>> = Readonly<
  z.output<Schema["values"]>
>;
