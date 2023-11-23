import { initializeApp, FirebaseOptions } from "firebase/app";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";

LiveConfig.init({
  appVersion: "0.0.0",
  platform: "test",
  environment: process.env.NODE_ENV || "development",
});

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDh7WKaA5cvXV1C554Djyd68vy_1LrXxhk",
  authDomain: "ledger-live-development.firebaseapp.com",
  projectId: "ledger-live-development",
  storageBucket: "ledger-live-development.appspot.com",
  messagingSenderId: "750497694072",
  appId: "1:750497694072:web:d2fc719100b45405bac88d",
};

initializeApp(firebaseConfig);

const remoteConfig = getRemoteConfig();

LiveConfig.setProviderGetValueMethod({
  firebaseRemoteConfig: (key: string) => {
    return getValue(remoteConfig, key);
  },
});

await fetchAndActivate(remoteConfig);

import { LiveConfig } from "../featureFlags";
import { getValueByKey } from "./helper";

describe("getValueByKey test", () => {
  it("should return the default value if LiveConfig in not instantiated", () => {
    expect(getValueByKey("key1")).toEqual(1);
    expect(getValueByKey("key2")).toEqual("2234ffdafs");
    expect(getValueByKey("key3")).toEqual(2.9);
    expect(getValueByKey("key4")).toEqual(true);
  });
});
