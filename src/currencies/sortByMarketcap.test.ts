import {
  sortByMarketcapV1,
  sortByMarketcapV2,
  sortByMarketcap,
} from "./sortByMarketcap";
import { listCryptoCurrencies, listTokens } from ".";
import { getBTCValues } from "../countervalues/mock";

test("sortByMarketcap snapshot", () => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const tickers = Object.keys(getBTCValues());
  expect(sortByMarketcap(list, tickers).map((c) => c.id)).toMatchSnapshot();
});
test("sortByMarketcapV2 = sortByMarketcapV1", () => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const tickers = Object.keys(getBTCValues());
  expect(sortByMarketcapV2(list, tickers).map((c) => c.id)).toMatchObject(
    sortByMarketcapV1(list, tickers).map((c) => c.id)
  );
});
