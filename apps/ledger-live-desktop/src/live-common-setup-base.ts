import "./env";
import { setEnv } from "@ledgerhq/live-env";
import { AppConfig } from "@ledgerhq/live-common/featureFlags/index";

if (process.env.NODE_ENV === "production") {
  const value = `lld/${__APP_VERSION__}`;
  setEnv("LEDGER_CLIENT_VERSION", value);
}

AppConfig.init({
  appVersion: __APP_VERSION__,
  platform: "desktop",
  environment: process.env.NODE_ENV || "development",
});
