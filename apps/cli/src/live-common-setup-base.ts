import { EnvName, setEnv, setEnvUnsafe, getEnv } from "@ledgerhq/live-env";
import { listen } from "@ledgerhq/logs";
import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import BigNumber from "bignumber.js";
import { setCryptoCurrenciesStore } from "@ledgerhq/cryptoassets";
import {
  CRYPTO_CURRENCIES_REGISTRY,
  CRYPTO_CURRENCY_ALIASES,
} from "@domain/entity-currency-crypto";

// The domain registry is the runtime source of truth for currency data.
setCryptoCurrenciesStore(Object.values(CRYPTO_CURRENCIES_REGISTRY), CRYPTO_CURRENCY_ALIASES);

setWalletAPIVersion(WALLET_API_VERSION);

registerAllCoins();

for (const k in process.env) setEnvUnsafe(k as EnvName, process.env[k]);

// Plain console logger for VERBOSE runs (e2e/CI). No colorize, no file output.
if (process.env.VERBOSE) {
  listen(log => {
    const { type, message, data } = log;
    let level = "info";

    if (type === "apdu" || type === "hw" || type === "speculos" || type.includes("debug")) {
      level = "debug";
    } else if (type.includes("warn")) {
      level = "warn";
    } else if (type.startsWith("network") || type.startsWith("socket")) {
      level = "http";
    } else if (type.includes("error")) {
      level = "error";
    }

    let dataStr = "";
    if (data !== undefined) {
      try {
        dataStr = ` ${JSON.stringify(data)}`;
      } catch {
        dataStr = ` ${String(data)}`;
      }
    }

    let line = `${level}: ${type}`;
    if (message !== undefined) line += `: ${message}`;
    line += dataStr;
    console.log(line);
  });
}

const value = "cli/0.0.0";
setEnv("LEDGER_CLIENT_VERSION", value);

BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });
