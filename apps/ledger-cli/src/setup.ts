/* eslint-disable no-console */
import winston from "winston";
import { EnvName, setEnv, setEnvUnsafe, getEnv } from "@ledgerhq/live-env";
import simple from "@ledgerhq/live-common/logs/simple";
import { listen } from "@ledgerhq/logs";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { registerTransportModule, disconnect } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import BigNumber from "bignumber.js";

setWalletAPIVersion(WALLET_API_VERSION);

const allCurrencies = [
  "aptos",
  "aptos_testnet",
  "adi",
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
  "polygon_amoy",
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
  "mantle",
  "mantle_sepolia",
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
  "sui_testnet",
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
];

// Filter to only currencies that exist in the bundled cryptoassets version,
// avoiding crashes when the compiled lib is behind the source list.
setSupportedCurrencies(
  allCurrencies.filter(id => findCryptoCurrencyById(id) != null) as Parameters<typeof setSupportedCurrencies>[0],
);

for (const k in process.env) setEnvUnsafe(k as EnvName, process.env[k]);

const { VERBOSE, VERBOSE_FILE } = process.env;
const logger = winston.createLogger({ level: "debug", transports: [] });
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

if (VERBOSE_FILE) {
  logger.add(
    new winston.transports.File({
      format: winstonFormatJSON,
      filename: VERBOSE_FILE,
      level: "debug",
    }),
  );
}

if (VERBOSE && VERBOSE !== "json") {
  logger.add(
    new winston.transports.Console({ format: winstonFormatConsole, level: "debug" }),
  );
} else {
  logger.add(
    new winston.transports.Console({ format: winstonFormatJSON, silent: !VERBOSE, level: "debug" }),
  );
}

listen(log => {
  const { type } = log;
  let level = "info";
  if (type === "apdu" || type === "hw" || type.includes("debug")) level = "debug";
  else if (type.includes("warn")) level = "warn";
  else if (type.startsWith("network") || type.startsWith("socket")) level = "http";
  else if (type.includes("error")) level = "error";
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  logger.log(level, log);
});

setEnv("LEDGER_CLIENT_VERSION", "ledger-cli/0.1.0");
BigNumber.set({ DECIMAL_PLACES: getEnv("BIG_NUMBER_DECIMAL_PLACES") });

LiveConfig.setConfig(liveConfig);
setupCalClientStore();

// Register hw-transport-node-hid as the HID transport module for bridge operations.
// This allows live-common bridges to sign/verify via device using deviceId: ""
const connectedDevices: Record<string, boolean> = {};

async function initHidTransport() {
  const { default: TransportNodeHid } = require("@ledgerhq/hw-transport-node-hid");
  registerTransportModule({
    id: "hid",
    open: (devicePath: string) =>
      retry(() => TransportNodeHid.open(devicePath), { context: "open-hid" }),
    disconnect: () => Promise.resolve(),
  });
}

if (!process.env.CI) {
  initHidTransport();
}

export function closeAllDevices() {
  Object.keys(connectedDevices).forEach(disconnect);
}
