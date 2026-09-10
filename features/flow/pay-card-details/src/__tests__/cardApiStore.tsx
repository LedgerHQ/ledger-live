import React, { type PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { cardManagementApi } from "@domain/api-card-management";
import { cardApi, cardApiExtra } from "@shared/api-services";

export const CARD_API_BASE_URL = "https://card.test";
export const CARD_DETAILS_TOKEN = "00000000-0000-4000-8000-000000000000";
export const CARD_DETAILS_IMAGE_URL = `${CARD_API_BASE_URL}/details-image?token=${CARD_DETAILS_TOKEN}`;
export const CARD_DETAILS = {
  token: CARD_DETAILS_TOKEN,
  imageUrl: CARD_DETAILS_IMAGE_URL,
};
export const CARD_DETAILS_TOKEN_URL = `${CARD_API_BASE_URL}/v1/card/details/token`;

export function makeCardApiStore() {
  return configureStore({
    reducer: {
      [cardManagementApi.reducerPath]: cardManagementApi.reducer,
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
