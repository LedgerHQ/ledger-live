import React from "react";
import { act, render, screen } from "@testing-library/react";
import { I18nWrapper, SETUP_COPY } from "../../__tests__/i18nWrapper";
import {
  dismissPredictionsSetup,
  MIN_SETUP_DISPLAY_MS,
  reportPredictionsSetup,
  startPredictionsSetup,
} from "../../predictionsSetupStore.internals";
import { PredictionsSetupSheet } from "./PredictionsSetupSheet";

// jsdom has no ResizeObserver, which the dialog uses to animate its height between states.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("PredictionsSetupSheet (web)", () => {
  const originalResizeObserver = global.ResizeObserver;

  beforeAll(() => {
    global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  });

  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    act(() => dismissPredictionsSetup());
    jest.useRealTimers();
  });

  afterAll(() => {
    global.ResizeObserver = originalResizeObserver;
  });

  // Lumen's stub renders the dialog as a plain element, so its name is checked through its label.
  it("names the dialog after what it shows", () => {
    render(<PredictionsSetupSheet />, { wrapper: I18nWrapper });
    let setupId = 0;
    act(() => {
      setupId = startPredictionsSetup();
    });

    expect(screen.getByLabelText(SETUP_COPY.settingUp.title)).toBeVisible();

    act(() => {
      void reportPredictionsSetup(setupId, { outcome: "found" });
      jest.advanceTimersByTime(MIN_SETUP_DISPLAY_MS);
    });

    expect(screen.getByLabelText(SETUP_COPY.setUp.found)).toBeVisible();
  });
});
