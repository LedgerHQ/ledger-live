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

  it("resolves and OFAC-filters fiats on getSupportedFiats fulfilled", () => {
    const store = makeStore();
    store.dispatch({
      type: `${cvsApi.reducerPath}/executeQuery/fulfilled`,
      payload: ["USD", "EUR", "RUB", "XXX"],
      meta: {
        arg: { type: "query", endpointName: "getSupportedFiats" },
        requestId: "test",
        requestStatus: "fulfilled",
      },
    });

    expect(selectSupportedFiats(store.getState() as WithSupportedFiats).map(c => c.id)).toEqual([
      "usd",
      "eur",
    ]);
  });
});
