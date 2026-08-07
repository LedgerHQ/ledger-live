import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { markPayCardFeatureTourSeen, payCardSlice } from "@domain/entity-pay-card";
import { Provider } from "react-redux";
import { FeatureTour } from "../index.native";
import type { FeatureTourContent, FeatureTourProps } from "../useFeatureTourViewModel";

jest.mock("@shared/queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({ children }: { children: React.ReactNode }) => children,
}));

const CONTENT: FeatureTourContent = {
  title: "Pay and get paid",
  description: "Stablecoin closes the gap between crypto and real life spending",
  ctaLabel: "Got it",
  rows: [
    { icon: "Globe", title: "Spend everywhere", description: "Use your balance around the world" },
    {
      icon: "Chart2",
      title: "Beat volatility",
      description: "Hold stablecoins pegged to the dollar",
    },
    {
      icon: "CreditCard",
      title: "Earn cashback",
      description: "Spend with a card and get 1% cashback",
    },
  ],
};

function makeStore() {
  return configureStore({ reducer: { payCard: payCardSlice.reducer } });
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

describe("FeatureTour (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the intro title and feature rows when not seen", () => {
    renderTour();

    expect(screen.getByText("Pay and get paid")).toBeTruthy();
    expect(screen.getByText("Spend with a card and get 1% cashback")).toBeTruthy();
  });

  it("tracks the screen view once shown", () => {
    const onTrackScreen = jest.fn();
    renderTour({ onTrackScreen });

    expect(onTrackScreen).toHaveBeenCalledWith("Page card feature intro");
  });

  it("marks the tour as seen and emits the click event on Got it", async () => {
    const user = userEvent.setup();
    const onTrackEvent = jest.fn();
    const { store } = renderTour({ onTrackEvent });

    await user.press(screen.getByLabelText("Got it"));

    expect(store.getState().payCard.hasSeenFeatureTour).toBe(true);
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "got it",
      page: "$page",
    });
  });

  it("renders nothing when the tour has already been seen", () => {
    const store = makeStore();
    store.dispatch(markPayCardFeatureTourSeen());
    renderTour({}, store);

    expect(screen.queryByText("Pay and get paid")).toBeNull();
  });
});
