import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { cardManagementApi } from "@domain/api-card-management";
import { I18nWrapper } from "./i18nWrapper";

export function createCardTestStore() {
  return configureStore({
    reducer: { [cardManagementApi.reducerPath]: cardManagementApi.reducer },
  });
}

export type CardTestStore = ReturnType<typeof createCardTestStore>;

export function cardTestWrapper(store: CardTestStore) {
  return function CardTestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <I18nWrapper>{children}</I18nWrapper>
      </Provider>
    );
  };
}
