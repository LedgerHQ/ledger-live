import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { EnvName, setEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import { listen } from "@ledgerhq/logs";
import winston from "winston";
import { liveConfig } from "../../config/sharedConfig";
import { setSupportedCurrencies } from "../../currencies";
import { WALLET_API_VERSION } from "../../wallet-api/constants";
import { setWalletAPIVersion } from "../../wallet-api/version";

setWalletAPIVersion(WALLET_API_VERSION);
setSupportedCurrencies([
  "aleo",
  "avalanche_c_chain",
  "avalanche_c_chain_fuji",
  "axelar",
  "stargaze",
  "secret_network",
  "umee",
  "desmos",
  "dydx",
  "onomy",
  "quicksilver",
  "persistence",
  "bitcoin",
  "ethereum",
  "bsc",
  "polygon",
  "elrond", // NOTE: legacy 'multiversx' name, kept for compatibility
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
  "assethub_polkadot",
  "bitcoin_testnet",
  "bitcoin_regtest",
  "ethereum_sepolia",
  "ethereum_hoodi",
  "crypto_org_croeseid",
  "crypto_org",
  "filecoin",
  "solana",
  "celo",
  "hedera",
  "cardano",
  "cardano_testnet",
  "osmosis",
  "filecoin",
  "fantom",
  "core",
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
  "shape",
  "story",
  "ton",
  "etherlink",
  "zksync",
  "zksync_sepolia",
  "mantra",
  "aptos",
  "aptos_testnet",
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
