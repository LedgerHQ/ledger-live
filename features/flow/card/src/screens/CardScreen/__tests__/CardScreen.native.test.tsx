import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { payCardApi, payCardApiExtra } from "@domain/api-pay-card";
import { payCardSlice } from "@domain/entity-pay-card";
import { Provider } from "react-redux";
import { CardScreen } from "../index.native";

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

function renderCardScreen(store = makeCardStore()) {
  return render(
    <Provider store={store}>
      <CardScreen />
    </Provider>,
  );
}

describe("CardScreen (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the card login entry", () => {
    renderCardScreen();

    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByText("Login to access your card")).toBeTruthy();
    expect(screen.getByLabelText("Login")).toBeTruthy();
  });

  it("hands the pre-auth login URL to the Shell through the pay card slice", async () => {
    const store = makeCardStore();
    renderCardScreen(store);

    fireEvent.press(screen.getByLabelText("Login"));

    await waitFor(() => {
      expect(store.getState().payCard).toEqual({
        loginUrl: "https://card.withcl.com/",
      });
    });
  });
});
