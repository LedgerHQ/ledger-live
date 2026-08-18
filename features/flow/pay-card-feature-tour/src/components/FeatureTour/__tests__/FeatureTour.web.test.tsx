import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { markPayCardFeatureTourSeen, payCardFeatureTourSlice } from "../../../state";
import { Provider } from "react-redux";
import { FeatureTour } from "../FeatureTour";
import type { FeatureTourContent, FeatureTourProps } from "../types";

const CONTENT: FeatureTourContent = {
  title: "Pay and get paid",
  description: "Stablecoin closes the gap between crypto and real life spending",
  ctaLabel: "Got it",
  rows: [
    {
      icon: "Globe",
      title: "Pay and get paid globally",
      description: "Benefits from low networks fees",
    },
    {
      icon: "Chart5",
      title: "Minimal volatility",
      description: "Stablecoin are based on fiat",
    },
    {
      icon: "CreditCard",
      title: "Spend with a card and get 1% cashback",
      description: "Pay in USDC, USDT, BTC, ETH and more",
    },
  ],
};

function makeStore() {
  return configureStore({ reducer: { payCardFeatureTour: payCardFeatureTourSlice.reducer } });
}

function renderTour(props: Partial<FeatureTourProps> = {}, store = makeStore()) {
  const merged: FeatureTourProps = { ...CONTENT, ...props };
  return {
    store,
    ...render(
      <Provider store={store}>
        <FeatureTour {...merged} />
      </Provider>,
    ),
  };
}

describe("FeatureTour (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the feature rows and CTA when not seen", () => {
    renderTour();

    expect(screen.getByText("Spend with a card and get 1% cashback")).toBeInTheDocument();
    expect(screen.getByText("Got it")).toBeInTheDocument();
  });

  it("tracks the screen view once shown", () => {
    const onTrackScreen = jest.fn();
    renderTour({ onTrackScreen });

    expect(onTrackScreen).toHaveBeenCalledWith("Page card feature intro");
  });

  it("marks the tour as seen and emits the click event on Got it", () => {
    const onTrackEvent = jest.fn();
    const { store } = renderTour({ onTrackEvent });

    fireEvent.click(screen.getByText("Got it"));

    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "got it",
      page: "$page",
    });
  });

  it("renders nothing when the tour has already been seen", () => {
    const store = makeStore();
    store.dispatch(markPayCardFeatureTourSeen());
    renderTour({}, store);

    expect(screen.queryByText("Spend with a card and get 1% cashback")).toBeNull();
  });
});
