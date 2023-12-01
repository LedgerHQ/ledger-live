import { LiveConfig } from "../../LiveConfig";
import { ConfigKeys, configSchema } from "./schema";

export function getValueByKey(key: ConfigKeys) {
  const configInstance = LiveConfig.getInstance();
  const defaultConfig = configSchema.parse({});

  if (!configInstance.providerGetvalueMethod) {
    // return all default values
    return defaultConfig[key];
  }

  const configProvier = LiveConfig.getInstance().providerGetvalueMethod;
  const value = configProvier?.firebaseRemoteConfig?.(key);

  return configSchema.shape[key].parse(value);
}
