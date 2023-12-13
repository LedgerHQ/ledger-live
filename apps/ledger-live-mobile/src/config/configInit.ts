import { LiveConfig, FirebaseRemoteConfigProvider } from "@ledgerhq/live-config";
import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";
import remoteConfig from "@react-native-firebase/remote-config";
import { sharedConfig } from "@ledgerhq/live-common/config/sharedConfig";

LiveConfig.init({
  appVersion: VersionNumber.appVersion,
  platform: Platform.OS,
  environment: process.env.NODE_ENV ?? "development",
});

LiveConfig.setProvider(
  new FirebaseRemoteConfigProvider({
    getValue: (key: string) => {
      return remoteConfig().getValue(key);
    },
  }),
);

LiveConfig.setConfig(sharedConfig);
