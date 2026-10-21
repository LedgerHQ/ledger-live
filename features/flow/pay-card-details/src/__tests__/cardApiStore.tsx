import React, { useMemo, type PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { cardManagementApi } from "@domain/api-card-management";
import { mockCardApiExtraArgument } from "@domain/api-card-management/mock/card-api";
import { payCardAuthSlice, type PayCardAuthState } from "@features/flow-pay-card-auth/state";
import { payCardOnboardingWidgetSlice } from "@features/flow-pay-card-widget/state";
import { I18nTestProvider } from "@shared/i18n/testing";
import { CARD_RESOURCES } from "./i18nWrapper";

export function makeCardApiStore({ signedIn = false }: { signedIn?: boolean } = {}) {
  return configureStore({
    reducer: {
      [cardManagementApi.reducerPath]: cardManagementApi.reducer,
      payCardAuth: payCardAuthSlice.reducer,
      // The card screens embed the onboarding widget's add-to-wallet CTA, which reads this slice.
      payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer,
    },
    preloadedState: {
      payCardAuth: {
        hasCard: signedIn,
        pendingLoginType: null,
        status: signedIn ? "signedIn" : "signedOut",
        isSessionResolving: false,
      } satisfies PayCardAuthState,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: { extraArgument: mockCardApiExtraArgument() },
      }).concat(cardManagementApi.middleware),
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

    return (
      <CardApiStoreProvider store={store}>
        <I18nTestProvider resources={CARD_RESOURCES}>{children}</I18nTestProvider>
      </CardApiStoreProvider>
    );
  };
}
