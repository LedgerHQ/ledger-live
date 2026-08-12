import { configureStore } from "@reduxjs/toolkit";
import { cardApi, cardApiExtra } from "@shared/api-services";
import { cardManagementApi } from "./api";

describe("cardManagementApi configuration", () => {
  it("is the Card service api, mutated in place by injectEndpoints", () => {
    expect(cardManagementApi).toBe(cardApi);
    expect(cardManagementApi.reducerPath).toBe("cardApi");
  });

  it("declares no endpoints of its own yet", () => {
    expect(Object.keys(cardManagementApi.endpoints)).toHaveLength(0);
  });

  // Wired the way the apps wire it: the store registers the *service api*, and this package's tags —
  // and later its endpoints — only live on that api because importing this module injected them.
  it("shares the Card service reducer and middleware once registered in a store", () => {
    const store = configureStore({
      reducer: {
        [cardApi.reducerPath]: cardApi.reducer,
      },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: cardApiExtra({
              cardApiBaseUrl: "https://card.test",
              cardBaanxClientKey: "test-client-key",
              getCardSessionToken: () => "session-token",
              refreshCardSession: () => Promise.resolve("refreshed-token"),
            }),
          },
        }).concat(cardApi.middleware),
    });

    expect(store.getState()).toHaveProperty(cardManagementApi.reducerPath);
  });
});
