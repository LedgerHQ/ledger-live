import { toCryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
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
  toCryptoCurrencyId("avalanche_c_chain"),
  toCryptoCurrencyId("axelar"),
  toCryptoCurrencyId("stargaze"),
  toCryptoCurrencyId("secret_network"),
  toCryptoCurrencyId("umee"),
  toCryptoCurrencyId("desmos"),
  toCryptoCurrencyId("dydx"),
  toCryptoCurrencyId("onomy"),
  toCryptoCurrencyId("sei_network"),
  toCryptoCurrencyId("quicksilver"),
  toCryptoCurrencyId("persistence"),
  toCryptoCurrencyId("bitcoin"),
  toCryptoCurrencyId("ethereum"),
  toCryptoCurrencyId("bsc"),
  toCryptoCurrencyId("polkadot"),
  toCryptoCurrencyId("westend"),
  toCryptoCurrencyId("assethub_westend"),
  toCryptoCurrencyId("assethub_polkadot"),
  toCryptoCurrencyId("solana"),
  toCryptoCurrencyId("solana_testnet"),
  toCryptoCurrencyId("solana_devnet"),
  toCryptoCurrencyId("ripple"),
  toCryptoCurrencyId("litecoin"),
  toCryptoCurrencyId("polygon"),
  toCryptoCurrencyId("bitcoin_cash"),
  toCryptoCurrencyId("stellar"),
  toCryptoCurrencyId("dogecoin"),
  toCryptoCurrencyId("cosmos"),
  toCryptoCurrencyId("crypto_org"),
  toCryptoCurrencyId("crypto_org_croeseid"),
  toCryptoCurrencyId("celo"),
  toCryptoCurrencyId("dash"),
  toCryptoCurrencyId("tron"),
  toCryptoCurrencyId("tezos"),
  toCryptoCurrencyId("ethereum_classic"),
  toCryptoCurrencyId("zcash"),
  toCryptoCurrencyId("decred"),
  toCryptoCurrencyId("digibyte"),
  toCryptoCurrencyId("algorand"),
  toCryptoCurrencyId("qtum"),
  toCryptoCurrencyId("bitcoin_gold"),
  toCryptoCurrencyId("komodo"),
  toCryptoCurrencyId("zencash"),
  toCryptoCurrencyId("bitcoin_testnet"),
  toCryptoCurrencyId("ethereum_sepolia"),
  toCryptoCurrencyId("ethereum_holesky"),
  toCryptoCurrencyId("ethereum_hoodi"),
  toCryptoCurrencyId("elrond"), // NOTE: legacy 'multiversx' name, kept for compatibility
  toCryptoCurrencyId("hedera"),
  toCryptoCurrencyId("cardano"),
  toCryptoCurrencyId("osmosis"),
  toCryptoCurrencyId("filecoin"),
  toCryptoCurrencyId("fantom"),
  toCryptoCurrencyId("core"),
  toCryptoCurrencyId("cronos"),
  toCryptoCurrencyId("moonbeam"),
  toCryptoCurrencyId("songbird"),
  toCryptoCurrencyId("flare"),
  toCryptoCurrencyId("near"),
  toCryptoCurrencyId("icon"),
  toCryptoCurrencyId("icon_berlin_testnet"),
  toCryptoCurrencyId("optimism"),
  toCryptoCurrencyId("optimism_sepolia"),
  toCryptoCurrencyId("arbitrum"),
  toCryptoCurrencyId("arbitrum_sepolia"),
  toCryptoCurrencyId("rsk"),
  toCryptoCurrencyId("bittorrent"),
  toCryptoCurrencyId("energy_web"),
  toCryptoCurrencyId("astar"),
  toCryptoCurrencyId("metis"),
  toCryptoCurrencyId("boba"),
  toCryptoCurrencyId("moonriver"),
  toCryptoCurrencyId("velas_evm"),
  toCryptoCurrencyId("syscoin"),
  toCryptoCurrencyId("vechain"),
  toCryptoCurrencyId("internet_computer"),
  toCryptoCurrencyId("klaytn"),
  toCryptoCurrencyId("polygon_zk_evm"),
  toCryptoCurrencyId("polygon_zk_evm_testnet"),
  toCryptoCurrencyId("base"),
  toCryptoCurrencyId("base_sepolia"),
  toCryptoCurrencyId("stacks"),
  toCryptoCurrencyId("telos_evm"),
  toCryptoCurrencyId("sei_network_evm"),
  toCryptoCurrencyId("berachain"),
  toCryptoCurrencyId("hyperevm"),
  toCryptoCurrencyId("coreum"),
  toCryptoCurrencyId("injective"),
  toCryptoCurrencyId("casper"),
  toCryptoCurrencyId("neon_evm"),
  toCryptoCurrencyId("lukso"),
  toCryptoCurrencyId("aptos"),
  toCryptoCurrencyId("aptos_testnet"),
  toCryptoCurrencyId("linea"),
  toCryptoCurrencyId("linea_sepolia"),
  toCryptoCurrencyId("blast"),
  toCryptoCurrencyId("blast_sepolia"),
  toCryptoCurrencyId("scroll"),
  toCryptoCurrencyId("scroll_sepolia"),
  toCryptoCurrencyId("ton"),
  toCryptoCurrencyId("etherlink"),
  toCryptoCurrencyId("zksync"),
  toCryptoCurrencyId("zksync_sepolia"),
  toCryptoCurrencyId("mantra"),
  toCryptoCurrencyId("xion"),
  toCryptoCurrencyId("sui"),
  toCryptoCurrencyId("zenrock"),
  toCryptoCurrencyId("sonic"),
  toCryptoCurrencyId("sonic_blaze"),
  toCryptoCurrencyId("mina"),
  toCryptoCurrencyId("babylon"),
  toCryptoCurrencyId("canton_network"),
  toCryptoCurrencyId("canton_network_devnet"),
  toCryptoCurrencyId("canton_network_testnet"),
  toCryptoCurrencyId("kaspa"),
]);

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

prepareCurrency(getCryptoCurrencyById(toCryptoCurrencyId("ethereum")));
