import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
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

  it("should toggle the persisted Q3 tour seen state independently", () => {
    const { store } = render(<Q3WalletV4TourScreenDebug />);

    expect(hasSeenQ3WalletV4TourSelector(store.getState())).toBe(false);

    fireEvent(screen.getByTestId("debug-q3-tour-seen-switch"), "onCheckedChange", true);

    expect(hasSeenQ3WalletV4TourSelector(store.getState())).toBe(true);
    expect(store.getState().settings.hasSeenQ2WalletV4Tour).toBe(false);
    expect(store.getState().settings.hasSeenWalletV4Tour).toBe(false);
  });
});
