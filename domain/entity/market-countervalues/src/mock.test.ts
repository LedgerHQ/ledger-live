import { BTCtoUSD, getBTCValues, referenceSnapshotDate, TICKER_TO_ID_AND_VALUE } from "./mock";

describe("getBTCValues", () => {
  test("reduces the table to ticker -> value in BTC", () => {
    const values = getBTCValues();

    expect(values.BTC).toBe(1);
    expect(Object.keys(values)).toEqual(Object.keys(TICKER_TO_ID_AND_VALUE));
  });

  test("computes the table once", () => {
    expect(getBTCValues()).toBe(getBTCValues());
  });
});

describe("TICKER_TO_ID_AND_VALUE", () => {
  test("gives every ticker a non-empty id and a positive value", () => {
    for (const [ticker, [id, value]] of Object.entries(TICKER_TO_ID_AND_VALUE)) {
      expect(id).not.toBe("");
      expect(value).toBeGreaterThan(0);
      expect(ticker).toBe(ticker.toUpperCase());
    }
  });
});

test("the snapshot the mock rates are anchored on", () => {
  expect(referenceSnapshotDate.getTime()).toBe(1588421046099);
  expect(BTCtoUSD).toBe(9000);
});
