import winston from "winston";
import { listen } from "@ledgerhq/logs";
import { setSupportedCurrencies } from "../../currencies";
import { setPlatformVersion } from "../../platform/version";
import { EnvName, setEnvUnsafe } from "../../env";
import { setWalletAPIVersion } from "../../wallet-api/version";
import { WALLET_API_VERSION } from "../../wallet-api/constants";
import { PLATFORM_VERSION } from "../../platform/constants";
import { setEnv } from "../../env";

setPlatformVersion(PLATFORM_VERSION);
setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies([
  "avalanche_c_chain",
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
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stealthcoin",
  "decred",
  "tron",
  "stellar",
  "cosmos",
  "algorand",
  "polkadot",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
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
  "cronos",
  "moonbeam",
  "songbird",
  "flare",
  "near",
  "stacks"
]);

for (const k in process.env) setEnvUnsafe(k as EnvName, process.env[k]);

const { VERBOSE, VERBOSE_FILE } = process.env;
const logger = winston.createLogger({
  level: "debug",
  transports: []
});
const { format } = winston;
const { combine, timestamp, json } = format;
const winstonFormat = combine(timestamp(), json());

if (VERBOSE_FILE) {
  logger.add(
    new winston.transports.File({
      format: winstonFormat,
      filename: VERBOSE_FILE,
      level: "debug"
    })
  );
}

logger.add(
  new winston.transports.Console({
    format: winstonFormat,
    silent: !VERBOSE
  })
);
// eslint-disable-next-line no-unused-vars
listen(({ type, message, ...rest }) => {
  logger.log("debug", {
    message: type + (message ? ": " + message : ""),
    // $FlowFixMe
    ...rest
  });
});

const value = "ll-ci/0.0.0";
setEnv("LEDGER_CLIENT_VERSION", value);
