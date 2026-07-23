import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen } from "@testing-library/react-native";
import { payCardApi, payCardApiExtra } from "@domain/api-pay-card";
import { payCardSlice, markPayCardFeatureTourSeen } from "@domain/entity-pay-card";
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

  it("renders the card title", () => {
    renderCardScreen();

    expect(screen.getByText("Card playground")).toBeTruthy();
  });

  it("renders the card description", () => {
    renderCardScreen();

    expect(screen.getByText("Card flow scaffold by design system")).toBeTruthy();
  });

  it("mounts the feature tour on first visit", () => {
    renderCardScreen();

    expect(screen.getByText("Pay and get paid")).toBeTruthy();
  });

  it("does not show the feature tour once it has been seen", () => {
    const store = makeCardStore();
    store.dispatch(markPayCardFeatureTourSeen());
    renderCardScreen(store);

    expect(screen.queryByText("Pay and get paid")).toBeNull();
  });
});
