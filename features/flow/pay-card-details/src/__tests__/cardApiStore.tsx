import React, { useMemo, type PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { cardManagementApi } from "@domain/api-card-management";
import { payCardAuthSlice } from "@features/flow-pay-card-auth/state";
import { cardApi, cardApiExtra } from "@shared/api-services";

export const CARD_API_BASE_URL = "https://card.test";
export const CARD_DETAILS_TOKEN = "00000000-0000-4000-8000-000000000000";
export const CARD_DETAILS_IMAGE_URL = `${CARD_API_BASE_URL}/details-image?token=${CARD_DETAILS_TOKEN}`;
export const CARD_DETAILS = {
  token: CARD_DETAILS_TOKEN,
  imageUrl: CARD_DETAILS_IMAGE_URL,
};
export const CARD_DETAILS_TOKEN_URL = `${CARD_API_BASE_URL}/v1/card/details/token`;
export const CARD_STATUS_URL = `${CARD_API_BASE_URL}/v1/card/status`;
export const CARD_USER_URL = `${CARD_API_BASE_URL}/v1/user`;

export const CARD_STATUS = {
  id: "000000000050277836",
  holderName: "JOHN DOE",
  expiryDate: "2028/01",
  panLast4: "1234",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2023-03-27T17:07:12.662Z",
} as const;

export const CARD_USER = {
  id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  verificationState: "VERIFIED",
} as const;

export const signedInCardApiHandlers = [
  http.get(CARD_STATUS_URL, () => HttpResponse.json(CARD_STATUS)),
  http.get(CARD_USER_URL, () => HttpResponse.json(CARD_USER)),
];

export function makeCardApiStore({ signedIn = false }: { signedIn?: boolean } = {}) {
  return configureStore({
    reducer: {
      [cardManagementApi.reducerPath]: cardManagementApi.reducer,
      payCardAuth: payCardAuthSlice.reducer,
    },
    preloadedState: {
      payCardAuth: { hasCard: signedIn, isSignedIn: signedIn },
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

export function SignedInCardApiProviders({ children }: PropsWithChildren) {
  const store = useMemo(() => makeCardApiStore({ signedIn: true }), []);
  return <CardApiStoreProvider store={store}>{children}</CardApiStoreProvider>;
}

export function listenToSignedInCardApi() {
  const server = setupServer(...signedInCardApiHandlers);

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}
