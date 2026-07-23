import Config from "react-native-config";
import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { listen } from "@ledgerhq/logs";
import { setEnv, getEnv } from "@shared/live-env";
import { bridgeEnvToNetworkState } from "@ledgerhq/live-common/network/setup";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";
import { setSecp256k1Instance } from "@ledgerhq/live-common/families/bitcoin/logic";
import { setGlobalOnBridgeError } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { setCryptoCurrenciesStore, setFiatCurrenciesStore } from "@ledgerhq/cryptoassets";
import {
  CRYPTO_CURRENCIES_REGISTRY,
  CRYPTO_CURRENCY_ALIASES,
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { FIAT_CURRENCIES_REGISTRY } from "@domain/entity-currency-fiat";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import "./experimental";
import logger, { ConsoleLogger } from "./logger";
import BigNumber from "bignumber.js";

// The domain registries are the runtime source of truth for currency data.
setCryptoCurrenciesStore(Object.values(CRYPTO_CURRENCIES_REGISTRY), CRYPTO_CURRENCY_ALIASES);
setFiatCurrenciesStore(Object.values(FIAT_CURRENCIES_REGISTRY));
setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});

registerAllCoins();

const consoleLogger = ConsoleLogger.getLogger();
listen(log => {
  consoleLogger.log(log);
});

setGlobalOnBridgeError(e => logger.critical(e));
setDeviceMode("event");
setWalletAPIVersion(WALLET_API_VERSION);
liveBlindSigningReporter.setContext({
  platform: "mobile",
  appVersion: VersionNumber.appVersion ?? undefined,
  platformOS: Platform.OS,
  platformVersion: String(Platform.Version),
});

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
bridgeEnvToNetworkState();

// eslint-disable-next-line @typescript-eslint/no-var-requires
setSecp256k1Instance(require("./logic/secp256k1"));

BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });
