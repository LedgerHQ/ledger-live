/* eslint-disable no-console */
import winston from "winston";
import { EnvName, setEnvUnsafe } from "@ledgerhq/live-common/env";
import simple from "@ledgerhq/live-common/logs/simple";
import { listen } from "@ledgerhq/logs";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { setPlatformVersion } from "@ledgerhq/live-common/platform/version";

setPlatformVersion("1.1.0");

setSupportedCurrencies([
  "bitcoin",
  "ethereum",
  "bsc",
  "polkadot",
  "ripple",
  "litecoin",
  "polygon",
  "bitcoin_cash",
  "stellar",
  "dogecoin",
  "cosmos",
  "dash",
  "tron",
  "tezos",
  "elrond",
  "ethereum_classic",
  "zcash",
  "decred",
  "digibyte",
  "algorand",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stakenet",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
  "cosmos_testnet",
  "crypto_org",
  "crypto_org_croeseid",
  "celo",
  "hedera",
  "cardano",
  "solana",
  "osmosis",
  "fantom",
  "moonbeam",
]);

for (const k in process.env) setEnvUnsafe(k as EnvName, process.env[k]);

const { VERBOSE, VERBOSE_FILE } = process.env;
const logger = winston.createLogger({
  level: "debug",
  transports: [],
});
const { format } = winston;
const { combine, json } = format;
const winstonFormatJSON = json();
const winstonFormatConsole = combine(
  format(({ type: _type, id: _id, date: _date, ...rest }) => rest)(),
  format.colorize(),
  simple()
);
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};
const level = VERBOSE && VERBOSE in levels ? VERBOSE : "debug";

if (VERBOSE_FILE) {
  logger.add(
    new winston.transports.File({
      format: winstonFormatJSON,
      filename: VERBOSE_FILE,
      level,
    })
  );
}

if (VERBOSE && VERBOSE !== "json") {
  logger.add(
    new winston.transports.Console({
      format: winstonFormatConsole,
      // FIXME: this option is not recognzed by winston API
      // colorize: true,
      level,
    })
  );
} else {
  logger.add(
    new winston.transports.Console({
      format: winstonFormatJSON,
      silent: !VERBOSE,
      level,
    })
  );
}

listen((log) => {
  const { type } = log;
  let level = "info";

  if (
    type === "apdu" ||
    type === "hw" ||
    type === "speculos" ||
    type.includes("debug")
  ) {
    level = "debug";
  } else if (type.includes("warn")) {
    level = "warn";
  } else if (type.startsWith("network") || type.startsWith("socket")) {
    level = "http";
  } else if (type.includes("error")) {
    level = "error";
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  logger.log(level, log);
});
