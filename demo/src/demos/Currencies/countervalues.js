// @flow

import axios from "axios";
import createCounterValues from "@ledgerhq/live-common/lib/countervalues";

export default createCounterValues({
  network: axios,
  log: (...args) => console.log(...args), // eslint-disable-line no-console
  getAPIBaseURL: () => window.LEDGER_CV_API,
  storeSelector: state => state.countervalues,
  pairsSelector: () => [],
  setExchangePairsAction: () => ({})
});
