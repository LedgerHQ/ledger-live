import { z } from "zod";
import { InvalidConfigOptionError } from "./errors";
import { acceptsDevValue, isAllowedSelection, selectionIdSchema } from "./internals/options";
import { validateValue } from "./internals/validateValue";
import { APP_CONFIG_OPTION_IDS } from "./schema";
import { resolveAppConfigValues } from "./values";
import type {
  AppConfigDeclarations,
  AppConfigStorage,
  ConfigOptionId,
  ConfigOptions,
  ConfigSchema,
  ConfigSchemaSwitches,
  ConfigStorage,
  ConfigSwitch,
  ResolvedAppConfig,
} from "./types";

/**
 * Resolves the configuration of one app session from the values the schema types: the selected
 * option of each switch, merged with the fixed values. A switch without a valid selection resolves
 * to the default option. Where the default is staging, a switch or a fixed value can also select
 * `dev`, which resolves to the dev values typed in the devtool. A prod-default build ignores `dev`.
 * Every option of every switch is parsed with its switch schema, selected or not, so a broken option
 * fails at boot in every build. A dev value that does not parse is ignored instead, so it never fails
 * the boot. The merged values
 * are then parsed strictly, and the configuration is frozen. `session` holds what it was resolved
 * from, for `createAppConfigMiddleware`.
 */
export function resolveAppConfig<
  Switches extends ConfigSchemaSwitches,
  Fixed extends z.ZodRawShape,
>({
  schema,
  default: defaultOptionId,
  storage,
  switches,
  fixed,
}: {
  readonly schema: ConfigSchema<Switches, Fixed>;
  /** The option of every switch without a valid selection. It depends on the build. */
  readonly default: ConfigOptionId;
  /** Where the app persists the selections and the dev values. Read once, synchronously. */
  readonly storage: AppConfigStorage;
  readonly switches: { readonly [Id in keyof Switches]: ConfigSwitch<ConfigOptions<Switches[Id]>> };
  readonly fixed: z.input<z.ZodObject<Fixed, z.core.$strict>>;
}): ResolvedAppConfig<ConfigSchema<Switches, Fixed>> {
  Object.entries(switches).forEach(
    ([switchId, configSwitch]: [string, ConfigSwitch<ConfigOptions<z.ZodRawShape>>]) =>
      parseOptions(configSwitch, schema.switches, switchId),
  );
  const declarations: AppConfigDeclarations = { switches, fixed, default: defaultOptionId };
  const selections = readEntries(storage.selections, selectionIdSchema, (id, selectionId) =>
    isAllowedSelection(declarations, id, selectionId),
  );
  const valueSchemas = schema.values.shape;

  // Ignore dev values on non-staging profiles
  const devValues =
    defaultOptionId !== "staging"
      ? {}
      : readEntries(
          storage.devValues,
          z.string(),
          (name, value) =>
            acceptsDevValue(declarations, name) &&
            validateValue(valueSchemas, name, value) === undefined,
        );

  const values = resolveAppConfigValues(declarations, selections, devValues);

  return {
    config: Object.freeze(schema.values.parse(values)),
    session: { ...declarations, selections, values, devValues, valueSchemas, storage },
  };
}

/**
 * The entries of `storage` that `accepts` keeps. The others are ignored and stay stored. A storage
 * holding anything else than `valueSchema` values by key is cleared.
 */
function readEntries<Value extends string>(
  storage: ConfigStorage,
  valueSchema: z.ZodType<Value>,
  accepts: (key: string, value: Value) => boolean,
): Record<string, Value> {
  try {
    const entries = z.record(z.string(), valueSchema).parse(storage.getAll() ?? {});
    return Object.fromEntries(
      Object.entries(entries).filter(([key, value]) => accepts(key, value)),
    );
  } catch {
    try {
      storage.clear();
    } catch {
      // A storage that cannot be read may not be cleared either: the defaults apply anyway.
    }
    return {};
  }
}

function parseOptions(
  { options }: ConfigSwitch<ConfigOptions<z.ZodRawShape>>,
  switches: ConfigSchemaSwitches,
  switchId: string,
) {
  const optionSchema = z.strictObject(switches[switchId]);
  for (const optionId of APP_CONFIG_OPTION_IDS) {
    const result = optionSchema.safeParse(options[optionId]);
    if (!result.success) throw new InvalidConfigOptionError(switchId, optionId, result.error);
  }
}
