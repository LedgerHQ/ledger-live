/* eslint-disable no-console */
import winston from "winston";
import { EnvName, setEnv, setEnvUnsafe, getEnv } from "@ledgerhq/live-env";
import simple from "@ledgerhq/live-common/logs/simple";
import { listen } from "@ledgerhq/logs";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import BigNumber from "bignumber.js";

setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies([
  "aptos",
  "aptos_testnet",
  "bitcoin",
  "ethereum",
  "bsc",
  "polkadot",
  "westend",
  "assethub_westend",
  "assethub_polkadot",
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
  "elrond", // NOTE: legacy 'multiversx' name, kept for compatibility
  "ethereum_classic",
  "zcash",
  "decred",
  "digibyte",
  "algorand",
  "avalanche_c_chain",
  "avalanche_c_chain_fuji",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "zencash",
  "bitcoin_testnet",
  "bitcoin_regtest",
  "ethereum_sepolia",
  "ethereum_hoodi",
  "crypto_org",
  "crypto_org_croeseid",
  "celo",
  "hedera",
  "cardano",
  "solana",
  "solana_testnet",
  "solana_devnet",
  "osmosis",
  "fantom",
  "moonbeam",
  "core",
  "cronos",
  "songbird",
  "flare",
  "near",
  "icon",
  "icon_berlin_testnet",
  "optimism",
  "optimism_sepolia",
  "arbitrum",
  "arbitrum_sepolia",
  "rsk",
  "bittorrent",
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
  "persistence",
  "quicksilver",
  "vechain",
  "internet_computer",
  "bitlayer",
  "klaytn",
  "klaytn_baobab",
  "polygon_zk_evm",
  "polygon_zk_evm_testnet",
  "base",
  "base_sepolia",
  "stacks",
  "telos_evm",
  "sei_evm",
  "berachain",
  "hyperevm",
  "coreum",
  "injective",
  "casper",
  "neon_evm",
  "lukso",
  "filecoin",
  "linea",
  "ton",
  "linea_sepolia",
  "blast",
  "blast_sepolia",
  "scroll",
  "scroll_sepolia",
  "shape",
  "story",
  "etherlink",
  "zksync",
  "zksync_sepolia",
  "mantra",
  "xion",
  "sui",
  "zenrock",
  "sonic",
  "sonic_blaze",
  "mina",
  "babylon",
  "canton_network",
  "canton_network_devnet",
  "canton_network_testnet",
  "kaspa",
  "monad",
  "monad_testnet",
  "somnia",
  "zero_gravity",
  "concordium",
  "concordium_testnet",
  "aleo",
  "aleo_testnet",
  "unichain",
  "unichain_sepolia",
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

BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });
