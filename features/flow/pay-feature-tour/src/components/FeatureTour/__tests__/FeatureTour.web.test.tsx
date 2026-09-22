import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PayAnalyticsProvider } from "@features/platform-pay-analytics";
import { markPayCardFeatureTourSeen, payCardFeatureTourSlice } from "../../../state";
import { Provider } from "react-redux";
import { FeatureTour } from "../FeatureTour";
import { I18nTestProvider } from "@shared/i18n/testing";
import { FEATURE_TOUR_RESOURCES } from "./fixtures";

function makeStore() {
  return configureStore({ reducer: { payCardFeatureTour: payCardFeatureTourSlice.reducer } });
}

function renderTour(store = makeStore(), adapter = { track: jest.fn() }) {
  return {
    store,
    adapter,
    ...render(
      <Provider store={store}>
        <PayAnalyticsProvider
          adapter={adapter}
          renderPage={page => <span data-testid="pay-track-page">{page}</span>}
        >
          <I18nTestProvider resources={FEATURE_TOUR_RESOURCES}>
            <FeatureTour />
          </I18nTestProvider>
        </PayAnalyticsProvider>
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

    expect(screen.getByText("Shop worldwide with crypto card")).toBeVisible();
    expect(screen.getByText("Explore Pay")).toBeVisible();
  });

  it("tracks the page when shown", () => {
    renderTour();

    expect(screen.getByTestId("pay-track-page")).toHaveTextContent("card feature intro");
  });

  it("marks the tour as seen and emits the click event on the CTA", () => {
    const { store, adapter } = renderTour();

    fireEvent.click(screen.getByText("Explore Pay"));

    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
    expect(adapter.track).toHaveBeenCalledWith("button_clicked", {
      button: "got it",
      flow: "card",
      page: "card feature intro",
    });
  });

  it("renders nothing when the tour has already been seen", () => {
    const store = makeStore();
    store.dispatch(markPayCardFeatureTourSeen());
    renderTour(store);

    expect(screen.queryByText("Shop worldwide with crypto card")).toBeNull();
    expect(screen.queryByTestId("pay-track-page")).toBeNull();
  });

  it("resolves its copy from the mounted i18n provider, not from props", () => {
    render(
      <Provider store={makeStore()}>
        <PayAnalyticsProvider adapter={{ track: jest.fn() }}>
          <I18nTestProvider
            resources={{ en: { translation: { payTab: { featureTour: { cta: "Compris" } } } } }}
          >
            <FeatureTour />
          </I18nTestProvider>
        </PayAnalyticsProvider>
      </Provider>,
    );

    expect(screen.getByText("Compris")).toBeVisible();
  });
});
