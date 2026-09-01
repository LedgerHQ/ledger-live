import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { markPayCardFeatureTourSeen, payCardFeatureTourSlice } from "../../../state";
import { Provider } from "react-redux";
import { FeatureTour } from "../FeatureTour";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { FeatureTourProps } from "../types";
import { FEATURE_TOUR_RESOURCES } from "./fixtures";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({ children }: { children: React.ReactNode }) => children,
}));

function makeStore() {
  return configureStore({ reducer: { payCardFeatureTour: payCardFeatureTourSlice.reducer } });
}

function renderTour(props: FeatureTourProps = {}, store = makeStore()) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <I18nTestProvider resources={FEATURE_TOUR_RESOURCES}>
          <FeatureTour {...props} />
        </I18nTestProvider>
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

  it("tracks the screen view once shown", () => {
    const onTrackScreen = jest.fn();
    renderTour({ onTrackScreen });

    expect(onTrackScreen).toHaveBeenCalledWith("Page card feature intro");
  });

  it("marks the tour as seen and emits the click event on the CTA", async () => {
    const user = userEvent.setup();
    const onTrackEvent = jest.fn();
    const { store } = renderTour({ onTrackEvent });

    await user.press(screen.getByLabelText("Explore Pay"));

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

    expect(screen.queryByText("All your payments, in one place")).toBeNull();
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

    expect(screen.getByLabelText("Compris")).toBeVisible();
  });
});
