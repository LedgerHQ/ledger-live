import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { selectFeature } from "@shared/feature-flags";
import { Q3TourSection } from "../components/Q3TourSection";
import { useWalletFeaturesDevToolViewModel } from "../hooks/useWalletFeaturesDevToolViewModel";
import {
  hasSeenQ2TourSelector,
  hasSeenQ3TourSelector,
  hasSeenWalletV4TourSelector,
} from "~/renderer/reducers/settings";

function Q3TourSetupHarness() {
  const { hasSeenQ3Tour, isQ3TourEnabled, handleToggleQ3TourHasSeen, handleToggleQ3TourEnabled } =
    useWalletFeaturesDevToolViewModel();

  return (
    <Q3TourSection
      hasSeen={hasSeenQ3Tour}
      isEnabled={isQ3TourEnabled}
      onToggleHasSeen={handleToggleQ3TourHasSeen}
      onToggleEnabled={handleToggleQ3TourEnabled}
    />
  );
}

const getFlagSwitch = () => screen.getAllByRole("switch")[0];
const getHasSeenSwitch = () => screen.getAllByRole("switch")[1];

describe("Q3 Tour setup", () => {
  it("should toggle the Q3 tour flag independently", async () => {
    const { user, store } = render(<Q3TourSetupHarness />);

    expect(selectFeature(store.getState(), "releaseTour")?.enabled).toBe(false);

    await user.click(getFlagSwitch());

    expect(selectFeature(store.getState(), "releaseTour")?.enabled).toBe(true);
    expect(selectFeature(store.getState(), "releaseTour")?.params?.variant).toBe("q3_a");
  });

  it("should toggle the persisted Q3 tour seen state independently", async () => {
    const { user, store } = render(<Q3TourSetupHarness />);

    expect(hasSeenQ3TourSelector(store.getState())).toBe(false);

    await user.click(getHasSeenSwitch());

    expect(hasSeenQ3TourSelector(store.getState())).toBe(true);
    expect(hasSeenQ2TourSelector(store.getState())).toBe(false);
    expect(hasSeenWalletV4TourSelector(store.getState())).toBe(false);
  });

  it("should keep Open Drawer disabled", () => {
    render(<Q3TourSetupHarness />, {
      initialState: withFlagOverrides({
        releaseTour: { enabled: true, params: { variant: "q3_a" } },
      }),
    });

    expect(screen.getByRole("button", { name: /open drawer/i })).toBeDisabled();
  });
});
