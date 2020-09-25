/* eslint-disable no-console */
import { implementCountervalues } from "../../countervalues";
import { setSupportedCurrencies } from "../../currencies";

implementCountervalues({
  getAPIBaseURL: () => window.LEDGER_CV_API,
  storeSelector: (state) => state.countervalues,
  pairsSelector: () => [],
  setExchangePairsAction: () => {},
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
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stakenet",
  "stealthcoin",
  "decred",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "tron",
  "stellar",
  "cosmos",
  "algorand",
]);
