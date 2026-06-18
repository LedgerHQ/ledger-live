/**
 * @jest-environment node
 */
import { configureStore } from "@reduxjs/toolkit";
import { cvsApi, cvsApiExtra } from "@domain/api-currencies";
import { FIAT_CURRENCIES_REGISTRY } from "@domain/entity-currency-fiat";
import { supportedFiatsReducer, setSupportedFiats } from "./slice";
import { supportedFiatsApi } from "./api";
import { selectSupportedFiats } from "./selectors";
import type { WithSupportedFiats } from "./schema";

function makeStore() {
  return configureStore({
    reducer: {
      supportedFiats: supportedFiatsReducer,
      [cvsApi.reducerPath]: cvsApi.reducer,
    },
    middleware: gdm =>
      gdm({ thunk: { extraArgument: cvsApiExtra("https://cvs.test") } }).concat(cvsApi.middleware),
  });
}

describe("supportedFiatsSlice", () => {
  it("starts empty", () => {
    const store = makeStore();
    expect(selectSupportedFiats(store.getState() as WithSupportedFiats)).toEqual([]);
  });

  it("stores the fiats passed to setSupportedFiats", () => {
    const store = makeStore();
    store.dispatch(setSupportedFiats([FIAT_CURRENCIES_REGISTRY.usd, FIAT_CURRENCIES_REGISTRY.eur]));
    expect(selectSupportedFiats(store.getState() as WithSupportedFiats).map(c => c.id)).toEqual([
      "usd",
      "eur",
    ]);
  });
});

describe("supportedFiatsApi binding", () => {
  it("resolves and OFAC-filters fiats into the slice when the query fulfills", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(["USD", "EUR", "RUB", "XXX"]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const store = makeStore();
    await store.dispatch(supportedFiatsApi.endpoints.getSupportedFiats.initiate());

    expect(selectSupportedFiats(store.getState() as WithSupportedFiats).map(c => c.id)).toEqual([
      "usd",
      "eur",
    ]);

    fetchSpy.mockRestore();
  });
});
