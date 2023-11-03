import { sortByMarketcap } from "./sortByMarketcap";
import { listCryptoCurrencies, listTokens } from ".";
import { getBTCValues } from "../countervalues/mock";
import { CURRENCIES_LIST, TICKERS } from "./mock";

test("sortByMarketcap snapshot", () => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const tickers = Object.keys(getBTCValues());
  expect(sortByMarketcap(list, tickers).map(c => c.id)).toMatchSnapshot();
});

test("sortByMarketcap simulate staking from portfolio", () => {
  expect(sortByMarketcap(CURRENCIES_LIST, TICKERS).map(c => c.id)).toEqual([
    "ethereum",
    "solana",
    "cardano",
    "polkadot",
    "cosmos",
    "near",
    "injective",
    "elrond",
    "tezos",
    "celo",
    "osmo",
    "axelar",
    "persistence",
    "onomy",
    "quicksilver",
  ]);
});
