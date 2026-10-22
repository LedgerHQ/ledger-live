import { z } from "zod";
import { InvalidConfigOptionError } from "./errors";
import type {
  AppConfig,
  ConfigOptionId,
  ConfigOptions,
  ConfigSchema,
  ConfigSchemaSwitches,
  ConfigSwitch,
  ConfigStorage,
} from "./types";

/**
 * Resolves the configuration of one app session from the values the schema types: the selected
 * option of each switch, merged with the fixed values. A switch without a valid selection resolves
 * to the default option. Every option of every switch is parsed with its switch schema, selected or
 * not, so a broken option fails at boot in every build. The merged values are then parsed strictly.
 * The result is frozen.
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
  /** Where the app persists the selected option id of each switch. Read once, synchronously. */
  readonly storage: ConfigStorage;
  readonly switches: { readonly [Id in keyof Switches]: ConfigSwitch<ConfigOptions<Switches[Id]>> };
  readonly fixed: z.input<z.ZodObject<Fixed, z.core.$strict>>;
}): AppConfig<ConfigSchema<Switches, Fixed>> {
  const selection = fromStorage(storage);
  const selectedValues = Object.entries(switches).map(
    ([switchId, configSwitch]: [string, ConfigSwitch<ConfigOptions<z.ZodRawShape>>]) =>
      parseOptions(configSwitch, schema.switches, switchId)[selection[switchId] ?? defaultOptionId],
  );
  return Object.freeze(schema.values.parse(Object.assign({}, ...selectedValues, fixed)));
}

function fromStorage(storage: ConfigStorage) {
  try {
    return z.record(z.string(), optionIdSchema).parse(storage.getAll() ?? {});
  } catch {
    // Clear the storage if it is not valid
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
  for (const optionId of optionIdSchema.options) {
    const result = optionSchema.safeParse(options[optionId]);
    if (!result.success) throw new InvalidConfigOptionError(switchId, optionId, result.error);
  }
  return options;
}

const optionIdSchema = z.enum({ prod: "prod", staging: "staging" } satisfies {
  readonly [Id in ConfigOptionId]: Id;
});
