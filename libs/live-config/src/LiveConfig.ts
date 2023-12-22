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

export type ConfigSchema = Record<string, ConfigInfo>;

export class LiveConfig {
  public provider?: Provider;
  public config: ConfigSchema = {};
  public appVersion?: string;
  public platform?: string;
  public environment?: string;
  public static configInstance: LiveConfig = new LiveConfig();

  private constructor() {}

  static setAppinfo(params: { appVersion?: string; platform?: string; environment?: string }) {
    LiveConfig.configInstance.appVersion = params.appVersion;
    LiveConfig.configInstance.platform = params.platform;
    LiveConfig.configInstance.environment = params.environment;
  }

  static setProvider(provider: Provider) {
    LiveConfig.configInstance.provider = provider;
  }

  static setConfig(config: ConfigSchema) {
    LiveConfig.configInstance.config = config;
  }

  static getValueByKey(key: string) {
    if (Object.keys(LiveConfig.configInstance.config).length === 0) {
      throw new Error("Config not set");
    }
    if (!LiveConfig.configInstance.provider) {
      // return default value if no provider is set
      return LiveConfig.configInstance.config[key]?.default;
    }
    return LiveConfig.configInstance.provider.getValueBykey(
      key,
      LiveConfig.configInstance.config[key],
    );
  }
}
