// @flow
import winston from "winston";
import { listen } from "@ledgerhq/logs";
import simple from "@ledgerhq/live-common/lib/logs/simple";

import { setSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies/index";
import { setWalletAPIVersion } from "@ledgerhq/live-common/lib/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/lib/wallet-api/constants";

setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies([
  "axelar",
  "stargaze",
  "secret_network",
  "umee",
  "desmos",
  "onomy",
  "quicksilver",
  "persistence",
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
  "coreum",
]);

const logger = winston.createLogger({
  level: "debug",
  transports: [
    new winston.transports.Console({
      format: simple(),
      silent: false,
      level: "debug",
    }),
  ],
});

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

  logger.log(level, log);
});
