import { LiveConfig, FirebaseRemoteConfigProvider } from "@ledgerhq/live-config";
import { fetchAndActivate, getRemoteConfig, getValue } from "firebase/remote-config";
import { getFirebaseConfig } from "~/firebase-setup";
import { initializeApp } from "firebase/app";

const firebaseConfig = getFirebaseConfig();
initializeApp(firebaseConfig);

const remoteConfig = getRemoteConfig();

void fetchAndActivate(remoteConfig);

export const liveConfig = new LiveConfig({
  appVersion: __APP_VERSION__,
  platform: "desktop",
  environment: process.env.NODE_ENV || "developement",
  provider: new FirebaseRemoteConfigProvider({
    getValue: (key: string) => {
      return getValue(remoteConfig, key);
    },
  }),
  config: {
    feature_learn: {
      type: "object",
      default: { enabled: true },
    },
  },
});
