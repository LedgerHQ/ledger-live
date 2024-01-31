import { ConfigInfo, ValidConfigTypes } from "../LiveConfig";

type ConfigTypes = keyof ValidConfigTypes;

export interface Provider {
  getValueByKey(key: string, info: ConfigInfo): ValidConfigTypes[ConfigTypes];
}

export * from "./firebaseRemoteConfig";
