import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";
import { sharedConfig } from "@ledgerhq/live-common/config/sharedConfig";

LiveConfig.init({
  appVersion: VersionNumber.appVersion,
  platform: Platform.OS,
  environment: process.env.NODE_ENV ?? "development",
});

LiveConfig.setConfig(sharedConfig);
