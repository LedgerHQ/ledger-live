import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { ESTIMATION_RECIPIENTS } from "./constants";

// Mirrors the bitcoin loader's supportedCoins (coin-bitcoin can't read the live-common registry).
const SUPPORTED_BITCOIN_COINS = [
  "bitcoin",
  "litecoin",
  "bitcoin_cash",
  "dogecoin",
  "dash",
  "zcash",
  "decred",
  "digibyte",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "zencash",
  "bitcoin_testnet",
  "bitcoin_regtest",
];

test("all bitcoin forks that have a manager app have a defined estimation recipient", () => {
  const currencyIds = SUPPORTED_BITCOIN_COINS.map(getCryptoCurrencyById)
    .filter(c => c.managerAppName && !c.isTestnetFor)
    .map(c => c.id)
    .sort();
  expect(currencyIds.every(id => ESTIMATION_RECIPIENTS[id] !== undefined)).toEqual(true);
});
