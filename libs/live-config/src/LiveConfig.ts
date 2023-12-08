import { Provider } from "./providers";

type ValidConfigTypes = {
  string: string;
  boolean: boolean;
  number: number;
  object: Record<string, unknown>;
  array: unknown[];
  enabled: { enabled: true | false };
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
  | ConfigInfoShape<"array">
  | ConfigInfoShape<"enabled">;

type TypeFromSchema<T extends keyof ValidConfigTypes> = T extends keyof ValidConfigTypes
  ? ValidConfigTypes[T]
  : never;

export type Config = Record<string, ConfigInfo>;

export class LiveConfig<ConfigType extends Config> {
  public appVersion: string;
  public platform: string;
  public environment: string;
  public provider: Provider;
  public config: ConfigType;

  constructor(config: {
    appVersion: string;
    platform: string;
    environment: string;
    provider: Provider;
    config: ConfigType;
  }) {
    this.appVersion = config.appVersion;
    this.platform = config.platform;
    this.environment = config.environment;
    this.provider = config.provider;
    this.config = config.config;
  }

  getValueByKey<Schema extends typeof this.config, Key extends keyof Schema>(key: Key) {
    return this.provider.getValueBykey(key, this.config[key]) as TypeFromSchema<
      Schema[Key]["type"]
    >;
  }
}
