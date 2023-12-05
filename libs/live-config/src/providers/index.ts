import { ConfigKeys, ConfigInfo } from "../schema";

export type SupportedProviders = "firebaseRemoteConfig";

export type Provider = {
  name: SupportedProviders;
  parser: (
    value: unknown,
    type: ConfigInfo["type"],
  ) => string | number | boolean | object | undefined;
  getValueByKey: <K extends ConfigKeys>(
    key: K,
    configInfo: ConfigInfo,
  ) => string | number | boolean | object;
};
