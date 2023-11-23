import { LiveConfig } from "../featureFlags";
import { ConfigKeys, configSchema } from "./schema";

export function getValueByKey<K extends ConfigKeys>(key: K) {
  const configInstance = LiveConfig.getInstance();

  if (!configInstance.providerGetvalueMethod) {
    // return all default values
    const config = configSchema.parse({});
    return config[key];
  }

  // const value: unknown =
  //   LiveConfig.getInstance().providerGetvalueMethod!["firebaseRemoteConfig"](key);
  //if (!value) {
  //  return defaultValue
  //}
  //if value type is not the same as ReturnType<typeof configDefaultValues[K]['parser']>
  //return defaultValue
  return "";
}
