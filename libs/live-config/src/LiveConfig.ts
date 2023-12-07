import { Provider } from "./providers";

type ValidConfigTypes = {
  string: string;
  boolean: boolean;
  number: number;
  object: object;
};

type ConfigInfoShape<Type extends keyof ValidConfigTypes> = {
  type: Type;
  default: ValidConfigTypes[Type];
};

export type ConfigInfo =
  | ConfigInfoShape<"string">
  | ConfigInfoShape<"boolean">
  | ConfigInfoShape<"number">
  | ConfigInfoShape<"object">;

type TypeFromSchema<T extends keyof ValidConfigTypes> = T extends keyof ValidConfigTypes
  ? ValidConfigTypes[T]
  : never;

export class LiveConfig<ConfigType extends Record<string, ConfigInfo>> {
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

  getValueByKey<Config extends typeof this.config, Key extends keyof Config>(key: Key) {
    return this.provider.getValueBykey(key, this.config[key]) as TypeFromSchema<
      Config[Key]["type"]
    >;
  }
}
