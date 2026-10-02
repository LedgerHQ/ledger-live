import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import {
  trackButtonClicked,
  trackedPages,
} from "@features/platform-pay-analytics/testing/module-mock";
import { markPayCardFeatureTourSeen } from "../../../state";
import { Provider } from "react-redux";
import { FeatureTour } from "../FeatureTour";
import { PAY_TAB_FEATURE_FLAG } from "../payTabFeatureFlag.native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { FEATURE_TOUR_RESOURCES, makeFeatureTourStore } from "./fixtures";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

function makeStore(card = true) {
  return makeFeatureTourStore(PAY_TAB_FEATURE_FLAG, card);
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

describe("FeatureTour (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the intro title and feature rows when not seen", () => {
    renderTour();

    expect(screen.getByText("All your payments, in one place")).toBeVisible();
    expect(screen.getByText("Shop worldwide with crypto card")).toBeVisible();
  });

  it("hides the card row when the pay feature flag card param is off", () => {
    renderTour(makeStore(false));

    expect(screen.queryByText("Shop worldwide with crypto card")).toBeNull();
    expect(screen.getByText("Pay your contacts")).toBeVisible();
    expect(screen.getByText("Request payments")).toBeVisible();
  });

  it("tracks the page when shown", () => {
    renderTour();

    expect(trackedPages()).toContainEqual({ page: "Feature Intro", name: "pay", flow: "pay" });
  });

  it("marks the tour as seen and emits the click event on the CTA", async () => {
    const user = userEvent.setup();
    const { store } = renderTour();

    await user.press(screen.getByLabelText("Explore Pay"));

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

    expect(screen.queryByText("All your payments, in one place")).toBeNull();
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

    expect(screen.getByLabelText("Compris")).toBeVisible();
  });
});
