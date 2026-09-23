import React from "react";
import { Text } from "react-native";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
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
          renderPage={(page, properties) => (
            <Text testID="pay-track-page">{`${page}:${properties?.flow}`}</Text>
          )}
        >
          <I18nTestProvider resources={FEATURE_TOUR_RESOURCES}>
            <FeatureTour />
          </I18nTestProvider>
        </PayAnalyticsProvider>
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

    expect(screen.getByText("All your payments, in one place")).toBeVisible();
    expect(screen.getByText("Shop worldwide with crypto card")).toBeVisible();
  });

  it("tracks the page when shown", () => {
    renderTour();

    expect(screen.getByTestId("pay-track-page")).toHaveTextContent("Feature Intro:pay");
  });

  it("marks the tour as seen and emits the click event on the CTA", async () => {
    const user = userEvent.setup();
    const { store, adapter } = renderTour();

    await user.press(screen.getByLabelText("Explore Pay"));

    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
    expect(adapter.track).toHaveBeenCalledWith("button_clicked", {
      button: "continue",
      flow: "pay",
      page: "Feature Intro",
    });
  });

  it("renders nothing when the tour has already been seen", () => {
    const store = makeStore();
    store.dispatch(markPayCardFeatureTourSeen());
    renderTour(store);

    expect(screen.queryByText("All your payments, in one place")).toBeNull();
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

    expect(screen.getByLabelText("Compris")).toBeVisible();
  });
});
