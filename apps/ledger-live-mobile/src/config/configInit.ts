import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { Platform } from "react-native";
import { appVersion } from "LLM/utils/appVersion";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";

LiveConfig.setAppinfo({
  appVersion: appVersion,
  platform: Platform.OS,
  environment: process.env.NODE_ENV ?? "development",
});

LiveConfig.setConfig(liveConfig);
