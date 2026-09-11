import React, { useMemo, type PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { setupServer } from "msw/node";
import { cardManagementApi } from "@domain/api-card-management";
import { payCardAuthSlice, type PayCardAuthState } from "@features/flow-pay-card-auth/state";
import { cardApi, cardApiExtra } from "@shared/api-services";

export const CARD_API_BASE_URL = "https://card.test";

export function makeCardApiStore({ signedIn = false }: { signedIn?: boolean } = {}) {
  return configureStore({
    reducer: {
      [cardManagementApi.reducerPath]: cardManagementApi.reducer,
      payCardAuth: payCardAuthSlice.reducer,
    },
    preloadedState: {
      payCardAuth: {
        hasCard: signedIn,
        status: signedIn ? "signedIn" : "signedOut",
      } satisfies PayCardAuthState,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: {
          extraArgument: cardApiExtra({
            getCardApiBaseUrl: () => CARD_API_BASE_URL,
            getCardBaanxClientKey: () => "client-key",
            readCardSession: () => Promise.resolve({ token: "session-token", sessionId: 1 }),
            isCardSessionCurrent: () => true,
            refreshCardSession: () => Promise.resolve({ kind: "session-replaced" as const }),
          }),
        },
      }).concat(cardApi.middleware),
  });
}

export function CardApiStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: ReturnType<typeof makeCardApiStore> }>) {
  return <Provider store={store}>{children}</Provider>;
}

export function cardApiWrapper({ signedIn = false }: { signedIn?: boolean } = {}) {
  return function CardApiWrapper({ children }: PropsWithChildren) {
    const store = useMemo(() => makeCardApiStore({ signedIn }), []);

    return <CardApiStoreProvider store={store}>{children}</CardApiStoreProvider>;
  };
}

export function listenToCardApi(handlers: Parameters<typeof setupServer> = []) {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}
