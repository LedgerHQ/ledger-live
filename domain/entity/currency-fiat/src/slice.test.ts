import { configureStore } from "@reduxjs/toolkit";
import { OFAC_FIAT_TICKERS } from "./constants";
import { setFiats, setFiatsReady, supportedFiatsSlice } from "./slice";
import { selectSupportedFiats, selectSupportedFiatsReady } from "./selector";
import { mockFiatCurrency } from "./schema.mock";

function makeStore() {
  return configureStore({
    reducer: { supportedFiats: supportedFiatsSlice.reducer },
  });
}

describe("OFAC_FIAT_TICKERS", () => {
  it("contains RUB", () => {
    expect(OFAC_FIAT_TICKERS.has("RUB")).toBe(true);
  });

  it("does not contain USD or EUR", () => {
    expect(OFAC_FIAT_TICKERS.has("USD")).toBe(false);
    expect(OFAC_FIAT_TICKERS.has("EUR")).toBe(false);
  });
});

describe("supportedFiatsSlice initial state", () => {
  it("is non-empty", () => {
    const store = makeStore();
    expect(selectSupportedFiats(store.getState()).length).toBeGreaterThan(0);
  });

  it("excludes all OFAC tickers", () => {
    const store = makeStore();
    const tickers = selectSupportedFiats(store.getState()).map(c => c.ticker);
    for (const blocked of OFAC_FIAT_TICKERS) {
      expect(tickers).not.toContain(blocked);
    }
  });

  it("includes USD and EUR", () => {
    const store = makeStore();
    const tickers = selectSupportedFiats(store.getState()).map(c => c.ticker);
    expect(tickers).toContain("USD");
    expect(tickers).toContain("EUR");
  });
});

describe("setFiats", () => {
  it("replaces the fiats list when payload is non-empty", () => {
    const store = makeStore();
    const currency = mockFiatCurrency();
    store.dispatch(setFiats([currency]));
    const result = selectSupportedFiats(store.getState());
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(currency);
  });

  it("ignores empty payloads (fallback is preserved)", () => {
    const store = makeStore();
    const before = selectSupportedFiats(store.getState());
    store.dispatch(setFiats([]));
    expect(selectSupportedFiats(store.getState())).toBe(before);
  });
});

describe("selectSupportedFiats", () => {
  it("returns the current fiats array", () => {
    const store = makeStore();
    const currency = mockFiatCurrency();
    store.dispatch(setFiats([currency]));
    expect(selectSupportedFiats(store.getState())).toEqual([currency]);
  });
});

describe("fiatsReady", () => {
  it("starts false", () => {
    const store = makeStore();
    expect(selectSupportedFiatsReady(store.getState())).toBe(false);
  });

  it("setFiatsReady sets it to true", () => {
    const store = makeStore();
    store.dispatch(setFiatsReady());
    expect(selectSupportedFiatsReady(store.getState())).toBe(true);
  });

  it("setFiatsReady is idempotent", () => {
    const store = makeStore();
    store.dispatch(setFiatsReady());
    store.dispatch(setFiatsReady());
    expect(selectSupportedFiatsReady(store.getState())).toBe(true);
  });

  it("setFiats does not flip fiatsReady", () => {
    const store = makeStore();
    store.dispatch(setFiats([mockFiatCurrency()]));
    expect(selectSupportedFiatsReady(store.getState())).toBe(false);
  });
});
