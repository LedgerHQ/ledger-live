import { ConfigInfo } from "../LiveConfig";

export interface Provider {
  getValueBykey<K>(key: K, info: ConfigInfo);
}

export * from "./firebaseRemoteConfig";
