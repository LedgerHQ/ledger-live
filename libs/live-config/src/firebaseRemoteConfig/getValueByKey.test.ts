import { LiveConfig, Value } from "../featureFlags";
import { getValueByKey } from "./helper";

LiveConfig.init({
  appVersion: "0.0.0",
  platform: "test",
  environment: process.env.NODE_ENV || "development",
});

describe("getValueByKey test", () => {
  it("should return the default value if LiveConfig in not instantiated", () => {
    expect(getValueByKey("key1")).toEqual(1);
    expect(getValueByKey("key2")).toEqual("2234ffdafs");
    expect(getValueByKey("key3")).toEqual(2.9);
    expect(getValueByKey("key4")).toEqual(true);
  });

  it("should return config value if instantied", () => {
    const mockConfig = {
      key1: 2,
      key2: "test",
      key3: 3.14,
      key4: false,
    };

    LiveConfig.setProviderGetValueMethod({
      firebaseRemoteConfig: (key: string) => {
        const entry = Object.entries(mockConfig).find(([entryKey]) => entryKey === key);

        if (!entry) {
          throw new Error("Could not found the key");
        }

        const [, value] = entry;

        return value as Value;
      },
    });

    expect(getValueByKey("key1")).toEqual(2);
    expect(getValueByKey("key2")).toEqual("test");
    expect(getValueByKey("key3")).toEqual(3.14);
    expect(getValueByKey("key4")).toEqual(false);
  });
});
