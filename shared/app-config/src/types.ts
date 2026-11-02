import type { z } from "zod";
import type { ValuesShape } from "./internals/types";

/** The zod namespace `defineConfigSchema` hands to its callback. */
export type Zod = typeof z;

export type ConfigStorage = {
  readonly getAll: () => unknown;
  readonly set: (key: string, value: string) => void;
  /** Removes one entry: a selection then resolves to the default, a value to its base value. */
  readonly remove: (key: string) => void;
  readonly clear: () => void;
};

/** One key of what the app persists in, such as `localStorage` or MMKV. Unset, it reads as nothing. */
export type StorageKey = {
  readonly get: () => string | null | undefined;
  readonly set: (value: string) => void;
  readonly remove: () => void;
};

/** Where the app persists what the devtool saves, read once and synchronously at boot. */
export type AppConfigStorage = {
  /** The selection of each switch, by switch id, and `dev` for each fixed value on Dev, by name. */
  readonly selections: ConfigStorage;
  /** The dev value of each value, by value name. Only a build whose default is staging reads it. */
  readonly devValues: ConfigStorage;
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

/**
 * What a switch or a fixed value runs on: an option of the switch, or `dev`, the values typed in
 * the devtool. Only a build whose default option is staging accepts `dev`.
 */
export type ConfigSelectionId = ConfigOptionId | "dev";

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

/** What a configuration is resolved from, apart from what the storage holds. */
export type AppConfigDeclarations = {
  readonly switches: ConfigSwitches;
  /** The fixed values the build declares, by name. */
  readonly fixed: Readonly<Record<string, unknown>>;
  /** The option of every switch without a valid selection. It depends on the build. */
  readonly default: ConfigOptionId;
};

/** What the configuration of a session was resolved from, as `resolveAppConfig` returns it. */
export type AppConfigSession = AppConfigDeclarations & {
  /** The selection of each switch and fixed value, as read at boot, that this session runs on. */
  readonly selections: Readonly<Record<string, ConfigSelectionId>>;
  /** Every value this session runs on, by name, as resolved before parsing. */
  readonly values: Readonly<Record<string, unknown>>;
  /** The dev values read at boot, each valid for its value. None when the default is prod. */
  readonly devValues: Readonly<Record<string, string>>;
  /** The schema of each value, by name, that its dev value is parsed with. */
  readonly valueSchemas: z.ZodRawShape;
  readonly storage: AppConfigStorage;
};

/** A dev value the middleware refused to save, and why. */
export type RejectedDevValue = { readonly value: string; readonly message: string };

/** The `appConfig` slice. */
export type AppConfigState = {
  /**
   * What the configuration of this session was resolved from, without its storage and value schemas.
   * `null` until `createAppConfigMiddleware` sets it, right after the store is created.
   */
  readonly session: Omit<AppConfigSession, "storage" | "valueSchemas"> | null;
  /** The selection of each switch and fixed value, which the next session resolves from. */
  readonly savedSelections: Readonly<Record<string, ConfigSelectionId>>;
  /** The dev values the next session resolves from. */
  readonly savedDevValues: Readonly<Record<string, string>>;
  /** The last dev value of each value that the middleware refused to save. */
  readonly devValueErrors: Readonly<Record<string, RejectedDevValue>>;
};

/** The configuration a schema describes, as `resolveAppConfig` returns it. */
export type AppConfig<Schema extends ConfigSchema<ConfigSchemaSwitches, z.ZodRawShape>> = Readonly<
  z.output<Schema["values"]>
>;

/** What `resolveAppConfig` returns: the configuration, and the session it was resolved from. */
export type ResolvedAppConfig<Schema extends ConfigSchema<ConfigSchemaSwitches, z.ZodRawShape>> = {
  readonly config: AppConfig<Schema>;
  readonly session: AppConfigSession;
};
