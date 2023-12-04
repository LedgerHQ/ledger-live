import { LiveConfig } from "../../LiveConfig";
import { ConfigKeys, configSchema } from "./schema";

export function getValueByKey(key: ConfigKeys) {
  const configInstance = LiveConfig.getInstance();
  const value = configInstance.providerGetvalueMethod?.firebaseRemoteConfig?.(key);

  return configSchema.shape[key].parse(value);
}
