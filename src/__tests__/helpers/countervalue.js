// @flow
import Prando from "prando";
import { getFiatUnit, getCurrencyByCoinType } from "@ledgerhq/currencies";
import { makeCalculateCounterValue } from "../../helpers/countervalue";

test("makeCalculateCounterValue basic test", () => {
  const getPairHistory = (ticker, fiat) => date =>
    0.0000001 * (Date.now() - date) +
    new Prando(`${ticker}-${fiat}`).next(0, 99);
  const calculateCounterValue = makeCalculateCounterValue(getPairHistory);
  const cur = getCurrencyByCoinType(1);
  const fiat = getFiatUnit("USD");
  const calc = calculateCounterValue(cur, fiat);
  expect(calc(42)).toBe(
    Math.round(42 * getPairHistory(cur.units[0].code, fiat.code)(new Date()))
  );
  expect(calc(42, new Date(2017, 3, 14))).toBe(
    Math.round(
      42 * getPairHistory(cur.units[0].code, fiat.code)(new Date(2017, 3, 14))
    )
  );
});
