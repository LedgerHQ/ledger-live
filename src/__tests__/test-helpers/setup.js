/* eslint-disable no-console */
import axios from "axios";
import WebSocket from "ws";
import { setNetwork, setWebSocketImplementation } from "../../network";
import { implementCountervalues } from "../../countervalues";
import { log } from "@ledgerhq/logs";
import "../../load/tokens/ethereum/erc20";
import { setSupportedCurrencies } from "../../data/cryptocurrencies";

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
      console.warn("http error", e.response.status, e.request.path);
      log("http-error", "HTTP " + status + ": " + String(e), {
        data,
        path: e.request.path
      });
    }
    return Promise.reject(e);
  }
);

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

setNetwork(axios);

setWebSocketImplementation(WebSocket);
