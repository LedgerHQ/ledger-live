import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import { PayTabScreen } from "LLM/features/PayTab";

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ top: 0 }),
}));

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => null,
}));

describe("PayTab feature tour integration", () => {
  it("should show the feature tour on first visit", async () => {
    render(<PayTabScreen />, {
      overrideInitialState: state => ({
        ...state,
        payCard: { ...state.payCard, hasSeenFeatureTour: false },
      }),
    });

    expect(screen.getByTestId("paytab-screen")).toBeVisible();
    await waitFor(() => {
      expect(screen.getByText("Pay and get paid")).toBeVisible();
    });
  });

  it("should persist dismissal and hide the tour after pressing Got it", async () => {
    const { user, store } = render(<PayTabScreen />, {
      overrideInitialState: state => ({
        ...state,
        payCard: { ...state.payCard, hasSeenFeatureTour: false },
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("Pay and get paid")).toBeVisible();
    });

    await user.press(screen.getByText("Got it"));

    await waitFor(() => {
      expect(store.getState().payCard.hasSeenFeatureTour).toBe(true);
      expect(screen.queryByText("Pay and get paid")).toBeNull();
    });
  });

  it("should not show the feature tour once it has been seen", () => {
    render(<PayTabScreen />, {
      overrideInitialState: state => ({
        ...state,
        payCard: { ...state.payCard, hasSeenFeatureTour: true },
      }),
    });

    expect(screen.getByTestId("paytab-screen")).toBeVisible();
    expect(screen.queryByText("Pay and get paid")).toBeNull();
  });
});
