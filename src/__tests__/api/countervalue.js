// @flow
import { getCurrencyByCoinType, getFiatUnit } from "@ledgerhq/currencies";
import { fetchCurrentRates, fetchHistodayRates } from "../../api/countervalue";

test("fetchCurrentRates", async () => {
  const res = await fetchCurrentRates(
    [getCurrencyByCoinType(0), getCurrencyByCoinType(2)],
    getFiatUnit("EUR")
  );
  expect(res.BTC).toBeTruthy();
  expect(res.LTC).toBeTruthy();
  expect(res.BTC.EUR.latest).toBeGreaterThan(0);
  expect(res.LTC.EUR.latest).toBeGreaterThan(0);
});

test("fetchHistodayRates", async () => {
  const res = await fetchHistodayRates(
    getCurrencyByCoinType(0),
    getFiatUnit("USD")
  );
  // 100 days at least
  expect(Object.keys(res).length).toBeGreaterThan(100);
});

test("fetchHistodayRates with multiple currencies", async () => {
  const res = await fetchHistodayRates(
    [getCurrencyByCoinType(0), getCurrencyByCoinType(2)],
    getFiatUnit("USD")
  );
  expect(res.BTC).toBeTruthy();
  expect(res.LTC).toBeTruthy();
  expect(res.BTC.USD).toBeTruthy();
  expect(res.LTC.USD).toBeTruthy();
  // 100 days at least
  expect(Object.keys(res.BTC.USD).length).toBeGreaterThan(100);
  expect(Object.keys(res.LTC.USD).length).toBeGreaterThan(100);
});
