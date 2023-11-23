/*
LiveConfig.init({
    appVersion: "2.0.0",
    platform: "desktop",
    environment: process.env.NODE_ENV || "development",
  });
*/
/*
LiveConfig.setProviderGetValueMethod({
          firebaseRemoteConfig: (key: string) => {
            return getValue(remoteConfig, key);
          },
        });
*/
import { getValueByKey } from "./helper";
describe("getValueByKey test", () => {
  it("should return the default value if LiveConfig in not instantiated", () => {
    expect(getValueByKey("key1")).toEqual(1);
    expect(getValueByKey("key2")).toEqual("2234ffdafs");
    expect(getValueByKey("key3")).toEqual(2.9);
    expect(getValueByKey("key4")).toEqual(true);
  });
});
