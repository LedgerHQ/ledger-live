// @flow
/* eslint-disable no-console */
import winston from "winston";
import { setEnvUnsafe } from "@ledgerhq/live-common/lib/env";
import { implementCountervalues } from "@ledgerhq/live-common/lib/countervalues";
import { listen } from "@ledgerhq/logs";
import implementLibcore from "@ledgerhq/live-common/lib/libcore/platforms/nodejs";
import "@ledgerhq/live-common/lib/load/tokens/ethereum/erc20";
import "@ledgerhq/live-common/lib/load/tokens/tron/trc10";
import "@ledgerhq/live-common/lib/load/tokens/tron/trc20";
import { setSupportedCurrencies } from "@ledgerhq/live-common/lib/data/cryptocurrencies";

implementCountervalues({
  getAPIBaseURL: () => window.LEDGER_CV_API,
  storeSelector: state => state.countervalues,
  pairsSelector: () => [],
  setExchangePairsAction: () => {}
});

setSupportedCurrencies([
  "bitcoin",
  "ethereum",
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
  "hcash",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stakenet",
  "stealthcoin",
  "poswallet",
  "clubcoin",
  "decred",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "tron",
  "stellar"
]);

for (const k in process.env) setEnvUnsafe(k, process.env[k]);

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
listen(({ id, date, type, message, ...rest }) => {
  logger.log("debug", {
    message: type + (message ? ": " + message : ""),
    // $FlowFixMe
    ...rest
  });
});

implementLibcore({
  lib: () => require("@ledgerhq/ledger-core"), // eslint-disable-line global-require
  dbPath: process.env.LIBCORE_DB_PATH || "./dbdata"
});
