/* eslint-disable no-console */
import winston from "winston";
import { EnvName, setEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import simple from "@ledgerhq/live-common/logs/simple";
import { listen } from "@ledgerhq/logs";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";

setWalletAPIVersion(WALLET_API_VERSION);

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
  "avalanche_c_chain",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
  "ethereum_sepolia",
  "ethereum_holesky",
  "crypto_org",
  "crypto_org_croeseid",
  "celo",
  "hedera",
  "cardano",
  "solana",
  "osmosis",
  "fantom",
  "moonbeam",
  "cronos",
  "songbird",
  "flare",
  "near",
  "optimism",
  "optimism_goerli",
  "arbitrum",
  "arbitrum_goerli",
  "rsk",
  "bittorrent",
  "kava_evm",
  "evmos_evm",
  "energy_web",
  "astar",
  "metis",
  "boba",
  "moonriver",
  "velas_evm",
  "syscoin",
  "axelar",
  "stargaze",
  "secret_network",
  "umee",
  "desmos",
  "dydx",
  "onomy",
  "sei_network",
  "persistence",
  "quicksilver",
  "vechain",
  "internet_computer",
  "klaytn",
  "polygon_zk_evm",
  "polygon_zk_evm_testnet",
  "base",
  "base_goerli",
  "stacks",
  "telos_evm",
  "coreum",
  "injective",
  "casper",
  "neon_evm",
  "lukso",
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
  format(({ type, message, id: _id, date: _date, ...rest }) => ({
    ...rest,
    message: `${type}: ${message}`,
  }))(),
  format.colorize(),
  simple(),
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
    }),
  );
}

if (VERBOSE && VERBOSE !== "json") {
  logger.add(
    new winston.transports.Console({
      format: winstonFormatConsole,
      // FIXME: this option is not recognzed by winston API
      // colorize: true,
      level,
    }),
  );
} else {
  logger.add(
    new winston.transports.Console({
      format: winstonFormatJSON,
      silent: !VERBOSE,
      level,
    }),
  );
}

listen(log => {
  const { type } = log;
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  logger.log(level, log);
});

const value = "cli/0.0.0";
setEnv("LEDGER_CLIENT_VERSION", value);
