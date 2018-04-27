// @flow
import Prando from "prando";
import { getFiatCurrencyByTicker, getCryptoCurrencyById } from "../../helpers/currencies";
import {
  makeCalculateCounterValue,
  makeReverseCounterValue,
  valueFromUnit
} from "../../helpers/countervalue";

test("valueFromUnit", () => {
  expect(valueFromUnit(1, getFiatCurrencyByTicker("USD").units[0])).toBe(100);
  expect(valueFromUnit(0.01, getCryptoCurrencyById("bitcoin_testnet").units[0])).toBe(1000000);
});

test("makeCalculateCounterValue basic test", () => {
  const getPairHistory = (ticker, fiat) => date =>
    !date
      ? 1 // for the test, we make countervalue value 1 at current price
      : date > new Date()
        ? 0 // let's assume we return 0 for future
        : 0.0000001 * (Date.now() - date) +
          new Prando(`${ticker}-${fiat}`).next(0, 99);
  const calculateCounterValue = makeCalculateCounterValue(getPairHistory);
  const reverseCounterValue = makeReverseCounterValue(getPairHistory);
  const cur = getCryptoCurrencyById("bitcoin");
  const fiat = getFiatCurrencyByTicker("USD");
  const calc = calculateCounterValue(cur, fiat);
  const reverse = reverseCounterValue(cur, fiat);
  expect(calc(42, new Date())).toBe(
    Math.round(42 * getPairHistory(cur.ticker, fiat.ticker)(new Date()))
  );
  expect(calc(42, new Date(), true)).toBe(
    42 * getPairHistory(cur.ticker, fiat.ticker)(new Date())
  );
  expect(calc(42)).toBe(42);
  expect(calc(42, new Date(2019, 1, 1))).toBe(0);
  expect(calc(42, new Date(2017, 1, 14))).toBe(
    Math.round(
      42 * getPairHistory(cur.ticker, fiat.ticker)(new Date(2017, 1, 14))
    )
  );
  expect(calc(42, new Date(2017, 1, 14), true)).toBe(
    42 * getPairHistory(cur.ticker, fiat.ticker)(new Date(2017, 1, 14))
  );

  expect(reverse(calc(42))).toBe(42);
  expect(reverse(calc(42, new Date(2017, 1, 14)), new Date(2017, 1, 14))).toBe(
    42
  );
  expect(reverse(calc(42, new Date(2019, 1, 14)), new Date(2019, 1, 14))).toBe(
    0
  );
});
