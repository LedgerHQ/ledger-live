import { ConfigInfo } from "../LiveConfig";

export interface Provider {
  getValueByKey(key: string, info: ConfigInfo);
}

export * from "./firebaseRemoteConfig";
