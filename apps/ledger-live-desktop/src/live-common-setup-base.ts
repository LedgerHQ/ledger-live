import { setEnv, getEnv } from "@ledgerhq/live-env";
import { setResolutionConfig } from "@shared/feature-flags";
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

BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });
