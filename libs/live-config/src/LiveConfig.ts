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
  public config!: ConfigSchema;
  public appVersion?: string;
  public platform?: string;
  public environment?: string;
  public static configInstance: LiveConfig | null = null;

  constructor(params: { appVersion?: string; platform?: string; environment?: string }) {
    this.appVersion = params.appVersion;
    this.platform = params.platform;
    this.environment = params.environment;
  }

  static init(params: { appVersion?: string; platform?: string; environment?: string }) {
    if (LiveConfig.configInstance) {
      throw new Error("Config instance already created");
    }
    LiveConfig.configInstance = new LiveConfig(params);
  }

  static setProvider(provider: Provider) {
    if (!LiveConfig.configInstance) {
      throw new Error("Config instance not created");
    }
    LiveConfig.configInstance.provider = provider;
  }

  static setConfig(config: ConfigSchema) {
    if (!LiveConfig.configInstance) {
      throw new Error("Config instance not created");
    }
    LiveConfig.configInstance.config = config;
  }

  static getValueByKey(key: string) {
    if (!LiveConfig.configInstance) {
      throw new Error("Config instance not created");
    }
    if (!LiveConfig.configInstance.provider) {
      throw new Error("Provider not set");
    }
    return LiveConfig.configInstance.provider.getValueBykey(
      key,
      LiveConfig.configInstance.config[key],
    );
  }
}
