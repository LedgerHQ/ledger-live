import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  trackButtonClicked,
  trackedPages,
} from "@features/platform-pay-analytics/testing/module-mock";
import { markPayCardFeatureTourSeen, payCardFeatureTourSlice } from "../../../state";
import { Provider } from "react-redux";
import { FeatureTour } from "../FeatureTour";
import { I18nTestProvider } from "@shared/i18n/testing";
import { FEATURE_TOUR_RESOURCES } from "./fixtures";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

function makeStore() {
  return configureStore({ reducer: { payCardFeatureTour: payCardFeatureTourSlice.reducer } });
}

function renderTour(store = makeStore()) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <I18nTestProvider resources={FEATURE_TOUR_RESOURCES}>
          <FeatureTour />
        </I18nTestProvider>
      </Provider>,
    ),
  };
}

describe("FeatureTour (Web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the feature rows and CTA when not seen", () => {
    renderTour();

    expect(screen.getByText("Shop worldwide with crypto card")).toBeVisible();
    expect(screen.getByText("Explore Pay")).toBeVisible();
  });

  it("tracks the page when shown", () => {
    renderTour();

    expect(trackedPages()).toContainEqual({ page: "Feature Intro", name: "pay", flow: "pay" });
  });

  it("marks the tour as seen and emits the click event on the CTA", () => {
    const { store } = renderTour();

    fireEvent.click(screen.getByText("Explore Pay"));

    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "continue",
      flow: "pay",
      page: "Feature Intro pay",
    });
  });

  it("renders nothing when the tour has already been seen", () => {
    const store = makeStore();
    store.dispatch(markPayCardFeatureTourSeen());
    renderTour(store);

    expect(screen.queryByText("Shop worldwide with crypto card")).toBeNull();
    expect(trackedPages()).toHaveLength(0);
  });

  it("resolves its copy from the mounted i18n provider, not from props", () => {
    render(
      <Provider store={makeStore()}>
        <I18nTestProvider
          resources={{ en: { translation: { payTab: { featureTour: { cta: "Compris" } } } } }}
        >
          <FeatureTour />
        </I18nTestProvider>
      </Provider>,
    );

    expect(screen.getByText("Compris")).toBeVisible();
  });
});
