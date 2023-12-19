import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import liveConfigSchema from "@ledgerhq/live-common/config/sharedConfig";

LiveConfig.setAppinfo({
  appVersion: __APP_VERSION__,
  platform: "desktop",
  environment: process.env.NODE_ENV || "development",
});

LiveConfig.setConfig(liveConfigSchema);
