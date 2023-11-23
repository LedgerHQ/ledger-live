type ConfigKeys = keyof typeof configDefaultValues;

export function getValueByKey<K extends ConfigKeys>(key: K): ReturnType<typeof configDefaultValues[K]['parser']> {
  //if (!LiveConfig.getInstance().providerGetvalueMethod) {
  //    return defaultValue;
  //}
  const value: unknown = LiveConfig.getInstance().providerGetvalueMethod!["firebaseRemoteConfig"](key);
  //if (!value) {
  //  return defaultValue
  //}
  //if value type is not the same as ReturnType<typeof configDefaultValues[K]['parser']>
    //return defaultValue
  return value;
}