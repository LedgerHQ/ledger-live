export declare interface Value {
  asBoolean(): boolean;
  asNumber(): number;
  asString(): string;
}

export class LiveConfig {
  public appVersion?: string;
  public platform?: string;
  public environment?: string;
  public providerGetvalueMethod?: { [provider: string]: (key: string) => Value };

  private static instance: LiveConfig; // Singleton instance
  private constructor() {}
  public static init(config: { appVersion: string; platform: string; environment: string }) {
    if (!LiveConfig.instance) {
      LiveConfig.instance = new LiveConfig();
      LiveConfig.instance.appVersion = config.appVersion;
      LiveConfig.instance.platform = config.platform;
    } else {
      throw new Error("LiveConfig instance is already initialized");
    }
  }

  public static setProviderGetValueMethod(provider2Method: {
    [provider: string]: (key: string) => Value;
  }) {
    if (!LiveConfig.instance) {
      throw new Error("LiveConfig instance is not initialized. Call init() first.");
    }
    if (!LiveConfig.instance.providerGetvalueMethod) {
      LiveConfig.instance.providerGetvalueMethod = {};
    }
    LiveConfig.instance.providerGetvalueMethod = {
      ...LiveConfig.instance.providerGetvalueMethod,
      ...provider2Method,
    };
  }

  public static getInstance(): LiveConfig {
    if (!LiveConfig.instance) {
      throw new Error("LiveConfig instance is not initialized. Call init() first.");
    }
    return LiveConfig.instance;
  }
}
