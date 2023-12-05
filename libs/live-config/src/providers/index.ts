import { ConfigKeys, ConfigInfo } from "../schema";

export type SupportedProviders = "firebaseRemoteConfig";

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
