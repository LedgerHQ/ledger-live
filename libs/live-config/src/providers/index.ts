import { ConfigInfo } from "../LiveConfig";

export interface Provider {
  getValueBykey<K>(key: K, info: ConfigInfo): string | number | boolean | object;
}
