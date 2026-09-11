import React from "react";
import { fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { selectFeature } from "@shared/feature-flags";
import { hasSeenQ2WalletV4TourSelector } from "~/reducers/settings";
import Q2WalletV4TourScreenDebug from "../index";

describe("Q2WalletV4TourScreenDebug", () => {
  it("should enable the Q2 release tour", () => {
    const { store } = render(<Q2WalletV4TourScreenDebug />);

    expect(screen.getByText("Open Drawer (enable Q2 release tour)")).toBeDisabled();

    fireEvent(screen.getAllByRole("switch")[0], "onCheckedChange", true);

    expect(selectFeature(store.getState(), "releaseTour")).toMatchObject({
      enabled: true,
      params: { variant: "q2" },
    });
  });

  it("should disable the Q2 release tour while retaining its variant", () => {
    const { store } = render(<Q2WalletV4TourScreenDebug />, {
      overrideInitialState: withFlagOverrides({
        releaseTour: { enabled: true, params: { variant: "q2" } },
      }),
    });

    expect(screen.getByText("Open Drawer")).toBeEnabled();

    fireEvent(screen.getAllByRole("switch")[0], "onCheckedChange", false);

    expect(selectFeature(store.getState(), "releaseTour")).toMatchObject({
      enabled: false,
      params: { variant: "q2" },
    });
  });

  it("should reset the persisted Q2 tour seen state", () => {
    const { store } = render(<Q2WalletV4TourScreenDebug />, {
      overrideInitialState: withFlagOverrides(
        { releaseTour: { enabled: true, params: { variant: "q2" } } },
        state => ({
          ...state,
          settings: { ...state.settings, hasSeenQ2WalletV4Tour: true },
        }),
      ),
    });

    expect(screen.getByText("Open Drawer (reset tour seen)")).toBeDisabled();

    fireEvent(screen.getAllByRole("switch")[1], "onCheckedChange", false);

    expect(hasSeenQ2WalletV4TourSelector(store.getState())).toBe(false);
  });
});
