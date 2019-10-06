// @flow
/* eslint-disable no-console */
import axios from "axios";
import { setEnvUnsafe } from "@ledgerhq/live-common/lib/env";
import {
  setNetwork,
  setWebSocketImplementation
} from "@ledgerhq/live-common/lib/network";
import { listen } from "@ledgerhq/logs";
import { setSupportedCurrencies } from "@ledgerhq/live-common/lib/data/cryptocurrencies";
import "@ledgerhq/live-common/lib/load/tokens/ethereum/erc20";
import "@ledgerhq/live-common/lib/load/tokens/tron/trc10";
import "./implement-react-native-libcore";
import { setTestFile } from "../engine";

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

// $FlowFixMe
if (__DEV__) {
  // eslint-disable-next-line no-unused-vars
  listen(({ id, date, type, message, ...rest }) => {
    console.log(type + (message ? ": " + message : ""));
  });
}

setNetwork(axios);

setWebSocketImplementation(WebSocket);

export const setup = (testName: string) => {
  setTestFile(testName);
};

export const simulateNetwork = (_enabled: boolean) => {
  // TODO
};
