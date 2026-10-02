import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import {
  formatCounterValueDay,
  formatCounterValueHashes,
  formatCounterValueHour,
  inferCurrencyAPIID,
  magFromTo,
  pairId,
  parseFormattedDate,
} from "./helpers";

const reference = new Date("2018-03-14T17:42:03.000Z");

describe("date formatting", () => {
  test("formats a date as a day and an hour key", () => {
    expect(formatCounterValueDay(reference)).toBe("2018-03-14");
    expect(formatCounterValueHour(reference)).toBe("2018-03-14T17");
  });

  test("round-trips a day and an hour key through parseFormattedDate", () => {
    expect(formatCounterValueDay(parseFormattedDate("2018-03-14"))).toBe("2018-03-14");
    expect(formatCounterValueHour(parseFormattedDate("2018-03-14T17"))).toBe("2018-03-14T17");
  });

  test("formatCounterValueHashes yields the iso, day and hour keys at once", () => {
    expect(formatCounterValueHashes(reference)).toEqual({
      iso: "2018-03-14T17:42:03.000Z",
      day: "2018-03-14",
      hour: "2018-03-14T17",
    });
  });
});

describe("inferCurrencyAPIID", () => {
  test("uses the ticker for a fiat currency", () => {
    expect(inferCurrencyAPIID(getFiatCurrencyByTicker("USD"))).toBe("USD");
  });

  test("uses the id for a crypto currency and a token", () => {
    expect(inferCurrencyAPIID(getCryptoCurrencyById("bitcoin"))).toBe("bitcoin");
    expect(inferCurrencyAPIID(mockTokenCurrency())).toBe("ethereum/erc20/usd-tether");
  });

  test("maps the two currencies the API knows under another id", () => {
    const assetHubPolkadot = getCryptoCurrencyById("assethub_polkadot");
    const concordiumTestnet = getCryptoCurrencyById("concordium_testnet");

    expect(inferCurrencyAPIID(assetHubPolkadot)).toBe("polkadot");
    expect(inferCurrencyAPIID(concordiumTestnet)).toBe("concordium");
  });
});

describe("pairId", () => {
  test("puts the destination currency first", () => {
    const from = getCryptoCurrencyById("bitcoin");
    const to = getFiatCurrencyByTicker("USD");

    expect(pairId({ from, to })).toBe("USD bitcoin");
    expect(pairId({ from: to, to: from })).toBe("bitcoin USD");
  });
});

describe("magFromTo", () => {
  test("is the ratio between the two default units' magnitudes", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    const usd = getFiatCurrencyByTicker("USD");

    expect(magFromTo(bitcoin, usd)).toBe(1e-6);
    expect(magFromTo(usd, bitcoin)).toBe(1e6);
  });
});
