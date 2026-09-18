import React from "react";
import { fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { selectFeature } from "@shared/feature-flags";
import { hasSeenQ3WalletV4TourSelector } from "~/reducers/settings";
import Q3WalletV4TourScreenDebug from "../Debug";

describe("Q3WalletV4Tour setup", () => {
  it("should toggle the Q3 tour flag independently", () => {
    const { store } = render(<Q3WalletV4TourScreenDebug />);

    expect(selectFeature(store.getState(), "releaseTour")?.enabled).toBe(false);

    fireEvent(screen.getByTestId("debug-q3-tour-enabled-switch"), "onCheckedChange", true);

    expect(selectFeature(store.getState(), "releaseTour")?.enabled).toBe(true);
    expect(selectFeature(store.getState(), "releaseTour")?.params?.variant).toBe("q3_a");
  });

  it("should disable the Q3 tour flag while retaining its variant", () => {
    const { store } = render(<Q3WalletV4TourScreenDebug />, {
      overrideInitialState: withFlagOverrides({
        releaseTour: { enabled: true, params: { variant: "q3_b" } },
      }),
    });

    fireEvent(screen.getByTestId("debug-q3-tour-enabled-switch"), "onCheckedChange", false);

    expect(selectFeature(store.getState(), "releaseTour")).toMatchObject({
      enabled: false,
      params: { variant: "q3_b" },
    });
  });

  it("should write the selected Q3 variant onto releaseTour", () => {
    const { store } = render(<Q3WalletV4TourScreenDebug />, {
      overrideInitialState: withFlagOverrides({
        releaseTour: { enabled: true, params: { variant: "q3_a" } },
      }),
    });

    fireEvent.press(screen.getByText("q3_b2"));

    expect(selectFeature(store.getState(), "releaseTour")).toMatchObject({
      enabled: true,
      params: { variant: "q3_b2" },
    });
  });

  it("should allow opening the drawer for an enabled Q3 variant other than q3_a", () => {
    render(<Q3WalletV4TourScreenDebug />, {
      overrideInitialState: withFlagOverrides({
        releaseTour: { enabled: true, params: { variant: "q3_b" } },
      }),
    });

    expect(screen.getByRole("button", { name: "Open Drawer" })).toBeEnabled();
  });

  it("should toggle the persisted Q3 tour seen state independently", () => {
    const { store } = render(<Q3WalletV4TourScreenDebug />);

    expect(hasSeenQ3WalletV4TourSelector(store.getState())).toBe(false);

    fireEvent(screen.getByTestId("debug-q3-tour-seen-switch"), "onCheckedChange", true);

    expect(hasSeenQ3WalletV4TourSelector(store.getState())).toBe(true);
    expect(store.getState().settings.hasSeenQ2WalletV4Tour).toBe(false);
    expect(store.getState().settings.hasSeenWalletV4Tour).toBe(false);
  });
});
