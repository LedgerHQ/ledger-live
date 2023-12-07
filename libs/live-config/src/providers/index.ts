import { ConfigInfo } from "../LiveConfig";

// refer to https://github.com/firebase/firebase-js-sdk/blob/master/packages/remote-config/src/public_types.ts#L71 for the firebase config value interface
export interface Value {
  asString(): string;
  asNumber(): number;
  asBoolean(): boolean;
}

export type SupportedProviders = "firebaseRemoteConfig";

export abstract class Provider {
  name: SupportedProviders;
  abstract getValueBykey<K>(key: K, info: ConfigInfo): string | number | boolean | object;

  constructor(config: { name: SupportedProviders }) {
    this.name = config.name;
  }
}
