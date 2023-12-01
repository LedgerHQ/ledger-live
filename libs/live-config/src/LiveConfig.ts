import { SupportedProviders } from "./providers";

// refer to https://github.com/firebase/firebase-js-sdk/blob/master/packages/remote-config/src/public_types.ts#L71 for the firebase config value interface
export interface Value {
  asString(s: unknown): string;
}

type ProviderGetValueMethod = { [provider in SupportedProviders]?: (key: string) => Value };

export class LiveConfig {
  public appVersion?: string;
  public platform?: string;
  public environment?: string;
  public providerGetvalueMethod?: ProviderGetValueMethod;

  private static instance: LiveConfig; // Singleton instance

  private constructor() {}

  public static init(config: { appVersion: string; platform: string; environment: string }) {
    if (!LiveConfig.instance) {
      LiveConfig.instance = new LiveConfig();
      LiveConfig.instance.appVersion = config.appVersion;
      LiveConfig.instance.platform = config.platform;
    }
  }

  public static getInstance(): LiveConfig {
    if (!LiveConfig.instance) {
      throw new Error("LiveConfig instance is not initialized. Call init() first.");
    }

    return LiveConfig.instance;
  }

  public static setProviderGetValueMethod(provider2Method: ProviderGetValueMethod) {
    if (!LiveConfig.getInstance().providerGetvalueMethod) {
      LiveConfig.instance.providerGetvalueMethod = {};
    }

    LiveConfig.instance.providerGetvalueMethod = {
      ...LiveConfig.instance.providerGetvalueMethod,
      ...provider2Method,
    };
  }
}
