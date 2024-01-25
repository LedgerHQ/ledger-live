import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById, getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";
import { inferTrackingPairForAccounts } from "./logic";

describe("inferTrackingPairForAccounts", () => {
  const accounts = Array(20)
    .fill(null)
    .map((_, i) => genAccount("test" + i));
  const usd = getFiatCurrencyByTicker("USD");

  test("trackingPairs have a deterministic order regardless of accounts order", () => {
    const trackingPairs = inferTrackingPairForAccounts(accounts, usd);
    const accounts2 = accounts.slice(10).concat(accounts.slice(0, 10));
    const trackingPairs2 = inferTrackingPairForAccounts(accounts2, usd);
    expect(trackingPairs).toEqual(trackingPairs2);
  });

  test("trackingPairs with same from and to are filtered out", () => {
    const first = genAccount("test1", { currency: getCryptoCurrencyById("bitcoin") });
    const trackingPairs = inferTrackingPairForAccounts([first], first.currency);
    expect(trackingPairs).toEqual([]);
  });

  test("trackingPairs with 2 accounts of same coin yield one tracking pair", () => {
    const first = genAccount("test1", { currency: getCryptoCurrencyById("bitcoin") });
    const second = genAccount("test2", { currency: getCryptoCurrencyById("bitcoin") });
    const trackingPairs = inferTrackingPairForAccounts([first, second], usd);
    expect(trackingPairs.length).toBe(1);
  });
});
