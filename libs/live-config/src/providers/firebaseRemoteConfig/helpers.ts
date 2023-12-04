import { LiveConfig } from "../../LiveConfig";
import { ConfigKeys, configSchema, defaultConfig } from "./schema";

export function getValueByKey(key: ConfigKeys) {
  const configInstance = LiveConfig.getInstance();
  const value = configInstance.providerGetvalueMethod?.firebaseRemoteConfig?.(key);

  console.log({ [key]: configSchema.shape[key].parse(value) });
  return configSchema.shape[key].parse(value) ?? defaultConfig[key];
}
