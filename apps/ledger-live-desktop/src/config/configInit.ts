import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { setCardanoKeychainObservableRangeSource } from "@ledgerhq/live-common/families/cardano/config";
import { getExperimentalKeychainObservableRange } from "~/renderer/experimental";

LiveConfig.setAppinfo({
  appVersion: __APP_VERSION__,
  platform: "desktop",
  environment: process.env.NODE_ENV || "development",
});

LiveConfig.setConfig(liveConfig);

setCardanoKeychainObservableRangeSource(getExperimentalKeychainObservableRange);
