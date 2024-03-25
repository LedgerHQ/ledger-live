import { Provider } from "./providers";
import merge from "lodash/merge";

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
  public static instance: LiveConfig = new LiveConfig();

  private constructor() {}

  static setAppinfo(params: { appVersion?: string; platform?: string; environment?: string }) {
    LiveConfig.instance.appVersion = params.appVersion;
    LiveConfig.instance.platform = params.platform;
    LiveConfig.instance.environment = params.environment;
  }

  static setProvider(provider: Provider) {
    LiveConfig.instance.provider = provider;
  }

  static setConfig(config: ConfigSchema) {
    LiveConfig.instance.config = config;
  }

  static getValueByKey(key: string) {
    if (Object.keys(LiveConfig.instance.config).length === 0) {
      throw new Error("Config not set");
    }
    if (!LiveConfig.instance.provider) {
      // return default value if no provider is set
      return LiveConfig.instance.config[key]?.default;
    }

    const providerValue =
      LiveConfig.instance.provider.getValueByKey(key, LiveConfig.instance.config[key]) ??
      LiveConfig.instance.config[key]?.default;

    if (LiveConfig.instance.config[key]?.type === "object") {
      // we spread the default values first and then the values from the provider
      // this is for backward compatiblity, a value could be renamed or deleted in a remote provider
      // but the default value will not change for a given version of Ledger Live
      // so we make sure that there's always a fallback in a case the value changed remotely
      return merge(LiveConfig.instance.config[key]?.default as object, providerValue as object);
    }

    return providerValue;
  }

  static getDefaultValueByKey(key: string) {
    if (Object.keys(LiveConfig.instance.config).length === 0) {
      throw new Error("Config not set");
    }
    return LiveConfig.instance.config[key]?.default;
  }
}
