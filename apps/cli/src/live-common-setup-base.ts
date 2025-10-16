import { toCryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
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
  toCryptoCurrencyId("aptos"),
  toCryptoCurrencyId("aptos_testnet"),
  toCryptoCurrencyId("bitcoin"),
  toCryptoCurrencyId("ethereum"),
  toCryptoCurrencyId("bsc"),
  toCryptoCurrencyId("polkadot"),
  toCryptoCurrencyId("westend"),
  toCryptoCurrencyId("assethub_westend"),
  toCryptoCurrencyId("assethub_polkadot"),
  toCryptoCurrencyId("ripple"),
  toCryptoCurrencyId("litecoin"),
  toCryptoCurrencyId("polygon"),
  toCryptoCurrencyId("bitcoin_cash"),
  toCryptoCurrencyId("stellar"),
  toCryptoCurrencyId("dogecoin"),
  toCryptoCurrencyId("cosmos"),
  toCryptoCurrencyId("dash"),
  toCryptoCurrencyId("tron"),
  toCryptoCurrencyId("tezos"),
  toCryptoCurrencyId("elrond"), // NOTE: legacy 'multiversx' name, kept for compatibility
  toCryptoCurrencyId("ethereum_classic"),
  toCryptoCurrencyId("zcash"),
  toCryptoCurrencyId("decred"),
  toCryptoCurrencyId("digibyte"),
  toCryptoCurrencyId("algorand"),
  toCryptoCurrencyId("avalanche_c_chain"),
  toCryptoCurrencyId("qtum"),
  toCryptoCurrencyId("bitcoin_gold"),
  toCryptoCurrencyId("komodo"),
  toCryptoCurrencyId("zencash"),
  toCryptoCurrencyId("bitcoin_testnet"),
  toCryptoCurrencyId("ethereum_sepolia"),
  toCryptoCurrencyId("ethereum_holesky"),
  toCryptoCurrencyId("ethereum_hoodi"),
  toCryptoCurrencyId("crypto_org"),
  toCryptoCurrencyId("crypto_org_croeseid"),
  toCryptoCurrencyId("celo"),
  toCryptoCurrencyId("hedera"),
  toCryptoCurrencyId("cardano"),
  toCryptoCurrencyId("solana"),
  toCryptoCurrencyId("solana_testnet"),
  toCryptoCurrencyId("solana_devnet"),
  toCryptoCurrencyId("osmosis"),
  toCryptoCurrencyId("fantom"),
  toCryptoCurrencyId("moonbeam"),
  toCryptoCurrencyId("core"),
  toCryptoCurrencyId("cronos"),
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
  toCryptoCurrencyId("axelar"),
  toCryptoCurrencyId("stargaze"),
  toCryptoCurrencyId("secret_network"),
  toCryptoCurrencyId("umee"),
  toCryptoCurrencyId("desmos"),
  toCryptoCurrencyId("dydx"),
  toCryptoCurrencyId("onomy"),
  toCryptoCurrencyId("sei_network"),
  toCryptoCurrencyId("persistence"),
  toCryptoCurrencyId("quicksilver"),
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
  toCryptoCurrencyId("filecoin"),
  toCryptoCurrencyId("linea"),
  toCryptoCurrencyId("ton"),
  toCryptoCurrencyId("linea_sepolia"),
  toCryptoCurrencyId("blast"),
  toCryptoCurrencyId("blast_sepolia"),
  toCryptoCurrencyId("scroll"),
  toCryptoCurrencyId("scroll_sepolia"),
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
