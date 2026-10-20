import { renderHook } from "tests/testSetup";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import {
  resolveMarketCounterValueUnit,
  useMarketCounterValueUnit,
} from "../useMarketCounterValueUnit";

const EUR_UNIT = getFiatCurrencyByTicker("EUR").units[0];

describe("resolveMarketCounterValueUnit", () => {
  it("resolves a fiat unit from its ticker, whatever the case", () => {
    expect(resolveMarketCounterValueUnit("usd", EUR_UNIT).code).toBe("$");
    expect(resolveMarketCounterValueUnit("CZK", EUR_UNIT).code).toBe("Kč");
  });

  it("resolves BTC and ETH to the crypto units Settings uses, not the fiat registry entry", () => {
    expect(resolveMarketCounterValueUnit("btc", EUR_UNIT).code).toBe("BTC");
    expect(resolveMarketCounterValueUnit("eth", EUR_UNIT).code).toBe("ETH");
  });

  it("falls back to the given unit for an empty or unknown ticker", () => {
    expect(resolveMarketCounterValueUnit(undefined, EUR_UNIT)).toBe(EUR_UNIT);
    expect(resolveMarketCounterValueUnit("xyz", EUR_UNIT)).toBe(EUR_UNIT);
  });
});

describe("useMarketCounterValueUnit", () => {
  it("falls back to the Settings unit when no Market counter currency is set", () => {
    const { result } = renderHook(() => useMarketCounterValueUnit(undefined), {
      initialState: { settings: { ...SETTINGS_INITIAL_STATE, counterValue: "EUR" } },
    });

    expect(result.current.code).toBe("€");
  });
});
