/**
 * @jest-environment node
 */
import { configureStore } from "@reduxjs/toolkit";
import { cvsApi } from "@domain/api-currencies";
import { supportedFiatsReducer } from "./slice";
import { selectSupportedFiats } from "./selectors";
import type { WithSupportedFiats } from "./schema";

function makeStore() {
  return configureStore({
    reducer: {
      supportedFiats: supportedFiatsReducer,
      [cvsApi.reducerPath]: cvsApi.reducer,
    },
    middleware: gdm => gdm().concat(cvsApi.middleware),
  });
}

describe("supportedFiatsSlice", () => {
  it("starts empty", () => {
    const store = makeStore();
    expect(selectSupportedFiats(store.getState() as WithSupportedFiats)).toEqual([]);
  });

  it("resolves and OFAC-filters fiats when getSupportedFiats fulfills", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(["USD", "EUR", "RUB", "XXX"]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const store = makeStore();
    await store.dispatch(cvsApi.endpoints.getSupportedFiats.initiate());

    expect(selectSupportedFiats(store.getState() as WithSupportedFiats).map(c => c.id)).toEqual([
      "usd",
      "eur",
    ]);

    fetchSpy.mockRestore();
  });
});
