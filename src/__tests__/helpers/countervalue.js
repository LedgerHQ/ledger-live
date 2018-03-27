// @flow
import Prando from "prando";
import { getFiatUnit, getCurrencyByCoinType } from "@ledgerhq/currencies";
import { makeCalculateCounterValue } from "../../helpers/countervalue";

test("makeCalculateCounterValue basic test", () => {
  const getPairHistory = (ticker, fiat) => date =>
    !date
      ? 1 // for the test, we make countervalue value 1 at current price
      : date > new Date()
        ? 0
        : 0.0000001 * (Date.now() - date) +
          new Prando(`${ticker}-${fiat}`).next(0, 99);
  const calculateCounterValue = makeCalculateCounterValue(getPairHistory);
  const cur = getCurrencyByCoinType(1);
  const fiat = getFiatUnit("USD");
  const calc = calculateCounterValue(cur, fiat);
  expect(calc(42, new Date())).toBe(
    Math.round(42 * getPairHistory(cur.units[0].code, fiat.code)(new Date()))
  );
  expect(calc(42)).toBe(42);
  // test it fallbacks on latest countervalue for an invalid date
  expect(calc(42, new Date(2019, 1, 1))).toBe(42);
  expect(calc(42, new Date(2017, 3, 14))).toBe(
    Math.round(
      42 * getPairHistory(cur.units[0].code, fiat.code)(new Date(2017, 3, 14))
    )
  );
});
