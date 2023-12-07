import { ConfigInfo } from "../LiveConfig";

export type SupportedProviders = "firebaseRemoteConfig" | "firebaseRemoteConfig";

export abstract class Provider {
  name: SupportedProviders;
  abstract getValueBykey<K>(key: K, info: ConfigInfo): string | number | boolean | object;

  constructor(config: { name: SupportedProviders }) {
    this.name = config.name;
  }
}
