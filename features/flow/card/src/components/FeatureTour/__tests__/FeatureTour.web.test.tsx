import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { payCardSlice, markPayCardFeatureTourSeen } from "@domain/entity-pay-card";
import { Provider } from "react-redux";
import { FeatureTour } from "../index";
import type { FeatureTourProps } from "../useFeatureTourViewModel";

function makeStore() {
  return configureStore({ reducer: { payCard: payCardSlice.reducer } });
}

function renderTour(props: FeatureTourProps = {}, store = makeStore()) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <FeatureTour {...props} />
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

    expect(screen.queryByText("Spend with a card and get 1% cashback")).toBeNull();
  });
});
