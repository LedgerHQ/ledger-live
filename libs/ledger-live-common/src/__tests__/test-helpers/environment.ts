import { toCryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
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
  toCryptoCurrencyId("polygon"),
  toCryptoCurrencyId("elrond"), // NOTE: legacy 'multiversx' name, kept for compatibility
  toCryptoCurrencyId("ripple"),
  toCryptoCurrencyId("bitcoin_cash"),
  toCryptoCurrencyId("litecoin"),
  toCryptoCurrencyId("dash"),
  toCryptoCurrencyId("ethereum_classic"),
  toCryptoCurrencyId("tezos"),
  toCryptoCurrencyId("qtum"),
  toCryptoCurrencyId("zcash"),
  toCryptoCurrencyId("bitcoin_gold"),
  toCryptoCurrencyId("stratis"),
  toCryptoCurrencyId("dogecoin"),
  toCryptoCurrencyId("digibyte"),
  toCryptoCurrencyId("komodo"),
  toCryptoCurrencyId("zencash"),
  toCryptoCurrencyId("decred"),
  toCryptoCurrencyId("tron"),
  toCryptoCurrencyId("stellar"),
  toCryptoCurrencyId("cosmos"),
  toCryptoCurrencyId("algorand"),
  toCryptoCurrencyId("polkadot"),
  toCryptoCurrencyId("bitcoin_testnet"),
  toCryptoCurrencyId("ethereum_sepolia"),
  toCryptoCurrencyId("ethereum_holesky"),
  toCryptoCurrencyId("ethereum_hoodi"),
  toCryptoCurrencyId("crypto_org_croeseid"),
  toCryptoCurrencyId("crypto_org"),
  toCryptoCurrencyId("filecoin"),
  toCryptoCurrencyId("solana"),
  toCryptoCurrencyId("celo"),
  toCryptoCurrencyId("hedera"),
  toCryptoCurrencyId("cardano"),
  toCryptoCurrencyId("cardano_testnet"),
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
  toCryptoCurrencyId("vechain"),
  toCryptoCurrencyId("casper"),
  toCryptoCurrencyId("neon_evm"),
  toCryptoCurrencyId("lukso"),
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
  toCryptoCurrencyId("aptos"),
  toCryptoCurrencyId("aptos_testnet"),
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
