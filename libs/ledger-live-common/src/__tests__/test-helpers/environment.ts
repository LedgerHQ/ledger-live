import winston from "winston";
import { listen } from "@ledgerhq/logs";
import { setSupportedCurrencies } from "../../currencies";
import { EnvName, setEnvUnsafe, setEnv } from "@ledgerhq/live-env";
import { setWalletAPIVersion } from "../../wallet-api/version";
import { WALLET_API_VERSION } from "../../wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "../../config/sharedConfig";

setWalletAPIVersion(WALLET_API_VERSION);
setSupportedCurrencies([
  "avalanche_c_chain",
  "axelar",
  "stargaze",
  "secret_network",
  "umee",
  "desmos",
  "dydx",
  "onomy",
  "sei_network",
  "quicksilver",
  "persistence",
  "bitcoin",
  "ethereum",
  "bsc",
  "polygon",
  "elrond",
  "ripple",
  "bitcoin_cash",
  "litecoin",
  "dash",
  "ethereum_classic",
  "tezos",
  "qtum",
  "zcash",
  "bitcoin_gold",
  "stratis",
  "dogecoin",
  "digibyte",
  "komodo",
  "zencash",
  "decred",
  "tron",
  "stellar",
  "cosmos",
  "algorand",
  "polkadot",
  "bitcoin_testnet",
  "ethereum_sepolia",
  "ethereum_holesky",
  "crypto_org_croeseid",
  "crypto_org",
  "crypto_org_cosmos",
  "filecoin",
  "solana",
  "celo",
  "hedera",
  "cardano",
  "cardano_testnet",
  "osmosis",
  "filecoin",
  "fantom",
  "cronos",
  "moonbeam",
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
  "internet_computer",
  "klaytn",
  "polygon_zk_evm",
  "polygon_zk_evm_testnet",
  "base",
  "base_sepolia",
  "stacks",
  "telos_evm",
  "coreum",
  "injective",
  "vechain",
  "casper",
  "neon_evm",
  "lukso",
  "linea",
  "linea_sepolia",
  "blast",
  "blast_sepolia",
  "scroll",
  "scroll_sepolia",
  "ton",
  "etherlink",
  "zksync",
  "zksync_sepolia",
  "mantra",
]);
LiveConfig.setConfig(liveConfig);

for (const k in process.env) setEnvUnsafe(k as EnvName, process.env[k]);

const { VERBOSE, VERBOSE_FILE } = process.env;
const logger = winston.createLogger({
  level: "debug",
  transports: [],
});
const { format } = winston;
const { combine, timestamp, json } = format;
const winstonFormat = combine(timestamp(), json());

if (VERBOSE_FILE) {
  logger.add(
    new winston.transports.File({
      format: winstonFormat,
      filename: VERBOSE_FILE,
      level: "debug",
    }),
  );
}

logger.add(
  new winston.transports.Console({
    format: winstonFormat,
    silent: !VERBOSE,
  }),
);
// eslint-disable-next-line no-unused-vars
listen(({ type, message, ...rest }) => {
  logger.log("debug", {
    message: type + (message ? ": " + message : ""),
    // $FlowFixMe
    ...rest,
  });
});

const value = "ll-ci/0.0.0";
setEnv("LEDGER_CLIENT_VERSION", value);
