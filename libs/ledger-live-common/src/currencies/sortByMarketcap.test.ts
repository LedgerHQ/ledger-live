import { sortByMarketcap } from "./sortByMarketcap";
import { listCryptoCurrencies, listTokens } from ".";
import { getBTCValues } from "../countervalues/mock";

test("sortByMarketcap snapshot", () => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const tickers = Object.keys(getBTCValues());
  expect(sortByMarketcap(list, tickers).map((c) => c.id)).toMatchSnapshot();
});
