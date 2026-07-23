import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { payCardApi, payCardApiExtra } from "@domain/api-pay-card";
import { payCardSlice } from "@domain/entity-pay-card";
import { StyleProvider } from "@features/platform-style";
import { Provider } from "react-redux";
import { CardScreen } from "../index";

function makeCardStore() {
  return configureStore({
    reducer: {
      payCard: payCardSlice.reducer,
      [payCardApi.reducerPath]: payCardApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: payCardApiExtra({ payCardApiMocksEnabled: true }),
        },
      }).concat(payCardApi.middleware),
  });
}

function renderCardScreen() {
  return render(
    <Provider store={makeCardStore()}>
      <StyleProvider colorScheme="light">
        <CardScreen />
      </StyleProvider>
    </Provider>,
  );
}

describe("CardScreen (Web)", () => {
  it("renders the card title", () => {
    const { getByText } = renderCardScreen();

    expect(getByText("Card playground")).toBeVisible();
  });

  it("renders the card description", () => {
    const { getByText } = renderCardScreen();

    expect(getByText("Card flow scaffold by design system")).toBeVisible();
  });
});
