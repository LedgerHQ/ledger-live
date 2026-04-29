import os from "os";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import { setResolutionConfig } from "@shared/feature-flags";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import BigNumber from "bignumber.js";

let ledgerClientVersion = `lld/${__APP_VERSION__}`;

if (process.env.NODE_ENV !== "production") {
  ledgerClientVersion += "-dev";
}

setEnv("LEDGER_CLIENT_VERSION", ledgerClientVersion);

process.env.LEDGER_CLIENT_VERSION = ledgerClientVersion;

setResolutionConfig({
  platform: "desktop",
  appVersion: __APP_VERSION__,
});

liveBlindSigningReporter.setContext({
  platform: "desktop",
  appVersion: __APP_VERSION__,
  platformOS: process.platform,
  platformVersion: os.release(),
});

BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });
