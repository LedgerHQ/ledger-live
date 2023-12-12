import { Provider } from "./providers";

type ValidConfigTypes = {
  string: string;
  boolean: boolean;
  number: number;
  object: Record<string, unknown>;
  array: unknown[];
};

type ConfigInfoShape<Type extends keyof ValidConfigTypes> = {
  type: Type;
  default: ValidConfigTypes[Type];
};

export type ConfigInfo =
  | ConfigInfoShape<"string">
  | ConfigInfoShape<"boolean">
  | ConfigInfoShape<"number">
  | ConfigInfoShape<"object">
  | ConfigInfoShape<"array">;

type TypeFromSchema<T extends keyof ValidConfigTypes> = T extends keyof ValidConfigTypes
  ? ValidConfigTypes[T]
  : never;

export type Config = Record<string, ConfigInfo>;

export class LiveConfig<ConfigType extends Config> {
  public provider: Provider;
  public config: ConfigType;

  constructor(config: { provider: Provider; config: ConfigType }) {
    this.provider = config.provider;
    this.config = config.config;
  }

  getValueByKey<Schema extends typeof this.config, Key extends keyof Schema>(key: Key) {
    return this.provider.getValueBykey(key, this.config[key]) as TypeFromSchema<
      Schema[Key]["type"]
    >;
  }
}
