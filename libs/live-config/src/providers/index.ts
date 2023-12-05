import { ConfigKeys, ConfigInfo } from "../schema";

// refer to https://github.com/firebase/firebase-js-sdk/blob/master/packages/remote-config/src/public_types.ts#L71 for the firebase config value interface
export interface Value {
  asString(): string;
  asNumber(): number;
  asBoolean(): boolean;
}

export type SupportedProviders = "firebaseRemoteConfig";

export type ProviderGetValueMethod = { firebaseRemoteConfig?: (key: string) => Value };

type ProviderParser = (
  value: unknown,
  type: ConfigInfo["type"],
) => string | number | boolean | object | undefined;

type ProviderGetValueByKey = <K extends ConfigKeys>(
  key: K,
  configInfo: ConfigInfo,
) => string | number | boolean | object;

export abstract class Provider {
  name: SupportedProviders;
  parser: ProviderParser;
  getValueByKey: ProviderGetValueByKey;

  constructor(
    name: SupportedProviders,
    parser: ProviderParser,
    getValueByKey: ProviderGetValueByKey,
  ) {
    this.name = name;
    this.parser = parser;
    this.getValueByKey = getValueByKey;
  }
}
