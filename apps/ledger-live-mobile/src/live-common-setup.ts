import Config from "react-native-config";
import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { listen } from "@ledgerhq/logs";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";
import { setSecp256k1Instance } from "@ledgerhq/live-common/families/bitcoin/logic";
import { setGlobalOnBridgeError } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { setResolutionConfig } from "@shared/feature-flags";
import "./experimental";
import logger, { ConsoleLogger } from "./logger";
import BigNumber from "bignumber.js";

const consoleLogger = ConsoleLogger.getLogger();
listen(log => {
  consoleLogger.log(log);
});

setGlobalOnBridgeError(e => logger.critical(e));
setDeviceMode("polling");
setWalletAPIVersion(WALLET_API_VERSION);
setResolutionConfig({
  platform: Platform.OS === "ios" ? "ios" : "android",
  appVersion: VersionNumber.appVersion ?? undefined,
});

registerAllCoins();

if (Config.FORCE_PROVIDER && !isNaN(parseInt(Config.FORCE_PROVIDER, 10)))
  setEnv("FORCE_PROVIDER", parseInt(Config.FORCE_PROVIDER, 10));

let ledgerClientVersion =
  Platform.OS === "ios"
    ? `llm-ios/${VersionNumber.appVersion}`
    : `llm-android/${VersionNumber.appVersion}`;

if (process.env.NODE_ENV !== "production") {
  ledgerClientVersion += "-dev";
}

setEnv("LEDGER_CLIENT_VERSION", ledgerClientVersion);
process.env.LEDGER_CLIENT_VERSION = ledgerClientVersion;

// eslint-disable-next-line @typescript-eslint/no-var-requires
setSecp256k1Instance(require("./logic/secp256k1"));

BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });
