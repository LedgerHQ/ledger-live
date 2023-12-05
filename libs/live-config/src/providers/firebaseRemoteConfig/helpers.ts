import { LiveConfig } from "../../LiveConfig";
import { ConfigInfo, ConfigKeys } from "../../schema";

/**  Get value for a given key from Firebase remote config */
export function getValueByKey<K extends ConfigKeys>(key: K, configInfo: ConfigInfo) {
  const configInstance = LiveConfig.getInstance();
  const value = configInstance.providerGetvalueMethod?.firebaseRemoteConfig?.(key);

  const parsedValue = configInfo.provider.parser(value, configInfo.type);
  // as never is a workaround to be able to correctly infer the returned type
  return parsedValue ?? configInfo.default;
}
