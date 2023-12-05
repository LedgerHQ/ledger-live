import { LiveConfig } from "../../LiveConfig";
import { Config, ConfigKeys, configSchema } from "./schema";

/**  Get value for a given key from Firebase remote config */
export function getValueByKey<K extends ConfigKeys>(key: K): Config[K] {
  const configInstance = LiveConfig.getInstance();
  const value = configInstance.providerGetvalueMethod?.firebaseRemoteConfig?.(key);

  // as never is a workaround to be able to correctly infer the returned type
  return configSchema.shape[key].parse(value) as never;
}
