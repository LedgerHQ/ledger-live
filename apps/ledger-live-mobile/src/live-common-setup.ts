import Config from "react-native-config";
import { listen } from "@ledgerhq/logs";
import { setEnv } from "@ledgerhq/live-env";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";
import { setSecp256k1Instance } from "@ledgerhq/live-common/families/bitcoin/logic";
import { setGlobalOnBridgeError } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { prepareCurrency } from "./bridge/cache";
import "./experimental";
import logger, { ConsoleLogger } from "./logger";

const consoleLogger = ConsoleLogger.getLogger();
listen(log => {
  consoleLogger.log(log);
});

setGlobalOnBridgeError(e => logger.critical(e));
setDeviceMode("polling");
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
  "polkadot",
  "solana",
  "solana_testnet",
  "solana_devnet",
  "ripple",
  "litecoin",
  "polygon",
  "bitcoin_cash",
  "stellar",
  "dogecoin",
  "cosmos",
  "crypto_org",
  "crypto_org_croeseid",
  "celo",
  "dash",
  "tron",
  "tezos",
  "ethereum_classic",
  "zcash",
  "decred",
  "digibyte",
  "algorand",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "zencash",
  "bitcoin_testnet",
  "ethereum_sepolia",
  "ethereum_holesky",
  "elrond", // NOTE: legacy 'multiversx' name, kept for compatibility
  "hedera",
  "cardano",
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
  "vechain",
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
  "casper",
  "neon_evm",
  "lukso",
  "aptos",
  "aptos_testnet",
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
  "xion",
  "zenrock",
  "sonic",
  "sonic_blaze",
]);

if (Config.FORCE_PROVIDER && !isNaN(parseInt(Config.FORCE_PROVIDER, 10)))
  setEnv("FORCE_PROVIDER", parseInt(Config.FORCE_PROVIDER, 10));

if (process.env.NODE_ENV === "production") {
  const value =
    Platform.OS === "ios"
      ? `llm-ios/${VersionNumber.appVersion}`
      : `llm-android/${VersionNumber.appVersion}`;
  setEnv("LEDGER_CLIENT_VERSION", value);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
setSecp256k1Instance(require("./logic/secp256k1"));

prepareCurrency(getCryptoCurrencyById("ethereum"));
