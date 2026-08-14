import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import { PayTabScreen } from "LLM/features/PayTab";

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ top: 0 }),
}));

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => null,
}));

// Feed an empty balance so this suite only asserts tour copy (hero has its own integration test).
jest.mock("LLM/features/PayTab/hooks/usePayCardBalance", () => ({
  usePayCardBalance: () => ({
    status: "ready",
    stableBalance: 0,
    filter: "all",
    hasBalance: false,
    filterOptions: [],
    formatCountervalue: () => ({}),
    onConfirmFilter: () => {},
  }),
}));

// Copy unique to the tour: the empty hero also renders "Pay and get paid".
const FEATURE_TOUR_ROW = "Minimal volatility";
const FEATURE_TOUR_CTA = "Got it";

describe("PayTab feature tour integration", () => {
  it("should show the feature tour on first visit", async () => {
    render(<PayTabScreen />, {
      overrideInitialState: state => ({
        ...state,
        payCardFeatureTour: { ...state.payCardFeatureTour, hasSeenFeatureTour: false },
      }),
    });

    expect(screen.getByTestId("paytab-screen")).toBeVisible();
    await waitFor(() => {
      expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
    });
  });

  it("should persist dismissal and hide the tour after pressing Got it", async () => {
    const { user, store } = render(<PayTabScreen />, {
      overrideInitialState: state => ({
        ...state,
        payCardFeatureTour: { ...state.payCardFeatureTour, hasSeenFeatureTour: false },
      }),
    });

    await waitFor(() => {
      expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
    });

    await user.press(screen.getByText(FEATURE_TOUR_CTA));

    await waitFor(() => {
      expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
      expect(screen.queryByText(FEATURE_TOUR_ROW)).toBeNull();
    });
  });

  it("should not show the feature tour once it has been seen", () => {
    render(<PayTabScreen />, {
      overrideInitialState: state => ({
        ...state,
        payCardFeatureTour: { ...state.payCardFeatureTour, hasSeenFeatureTour: true },
      }),
    });

    expect(screen.getByTestId("paytab-screen")).toBeVisible();
    expect(screen.queryByText(FEATURE_TOUR_ROW)).toBeNull();
  });
});
