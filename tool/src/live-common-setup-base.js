// @flow
/* eslint-disable no-console */
import winston from "winston";
import axios from "axios";
import WebSocket from "ws";
import { setEnvUnsafe } from "@ledgerhq/live-common/lib/env";
import {
  setNetwork,
  setWebSocketImplementation
} from "@ledgerhq/live-common/lib/network";
import { implementCountervalues } from "@ledgerhq/live-common/lib/countervalues";
import { log, listen } from "@ledgerhq/logs";
import { logs as socketLogs } from "@ledgerhq/live-common/lib/api/socket";
import implementLibcore from "@ledgerhq/live-common/lib/libcore/platforms/nodejs";
import "@ledgerhq/live-common/lib/load/tokens/ethereum/erc20";
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
  "ethereum_ropsten"
]);

for (const k in process.env) setEnvUnsafe(k, process.env[k]);

const { VERBOSE, VERBOSE_FILE } = process.env;

const logger = winston.createLogger({
  level: "debug",
  transports: []
});

const winstonFormat = winston.format.simple();

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

socketLogs.subscribe(({ type, ...rest }) => {
  logger.log("debug", {
    message: "socket:" + type,
    ...rest
  });
});

setNetwork(axios);

axios.interceptors.request.use(config => {
  log("http", config.method + " " + config.url, config);
  return config;
});

axios.interceptors.response.use(
  r => {
    log("http-success", r.config.method + " " + r.config.url + " " + r.status);
    return r;
  },
  e => {
    if (e.response) {
      const { data, status } = e.response;
      log("http-error", "HTTP " + status + ": " + String(e), { data });
    }
    return Promise.reject(e);
  }
);

setWebSocketImplementation(WebSocket);

implementLibcore({
  lib: () => require("@ledgerhq/ledger-core"), // eslint-disable-line global-require
  dbPath: process.env.LIBCORE_DB_PATH || "./dbdata"
});
