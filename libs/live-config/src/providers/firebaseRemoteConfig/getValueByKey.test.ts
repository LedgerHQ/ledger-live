import { LiveConfig } from "../../LiveConfig";
import { getValueByKey } from "./helpers";
import { fetchAndActivate, getRemoteConfig, getValue } from "firebase/remote-config";
import { initializeApp } from "firebase/app";

const mockConfig = {
  cosmos_gas_amplifer1: {
    asBoolean: () => true,
    asString: () => "true",
  },
  cosmos_gas_amplifer: {
    asNumber: () => 10,
  },
  feature_test1: {
    asString: () => "feature_test",
  },
  feature_app_author_name: {
    asString: () => JSON.stringify({ enabled: true }),
  },
};

jest.mock("firebase/remote-config", () => ({
  fetchAndActivate: jest.fn().mockReturnValue(Promise.resolve()),
  getRemoteConfig: jest.fn(),
  getValue: jest.fn((_: unknown, key: string) => mockConfig[key]),
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(_ => {}),
}));

describe("getValueByKey", () => {
  beforeAll(async () => {
    LiveConfig.init({
      appVersion: "0.1.0",
      platform: "test",
      environment: process.env.NODE_ENV || "development",
    });

    initializeApp({
      apiKey: "AIzaSyDh7WKaA5cvXV1C554Djyd68vy_1LrXxhk",
      authDomain: "ledger-live-development.firebaseapp.com",
      projectId: "ledger-live-development",
      storageBucket: "ledger-live-development.appspot.com",
      messagingSenderId: "750497694072",
      appId: "1:750497694072:web:d2fc719100b45405bac88d",
    });

    const remoteConfig = getRemoteConfig();

    await fetchAndActivate(remoteConfig);

    LiveConfig.setProviderGetValueMethod({
      firebaseRemoteConfig: (key: string) => {
        return getValue(remoteConfig, key);
      },
    });
  });

  it("should return config value if instantied", () => {
    expect(getValueByKey("cosmos_gas_amplifer1")).toEqual(true);
    expect(getValueByKey("cosmos_gas_amplifer")).toEqual(10);
    expect(getValueByKey("feature_test1")).toEqual("feature_test");
    expect(getValueByKey("feature_app_author_name")).toEqual({ enabled: true });
  });
});
