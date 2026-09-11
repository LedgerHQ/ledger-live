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
  const {
    hasSeenQ3Tour,
    isQ3TourEnabled,
    selectedQ3TourVariant,
    handleToggleQ3TourHasSeen,
    handleToggleQ3TourEnabled,
    handleQ3TourVariantChange,
  } = useWalletFeaturesDevToolViewModel();

  return (
    <Q3TourSection
      hasSeen={hasSeenQ3Tour}
      isEnabled={isQ3TourEnabled}
      selectedVariant={selectedQ3TourVariant}
      onToggleHasSeen={handleToggleQ3TourHasSeen}
      onToggleEnabled={handleToggleQ3TourEnabled}
      onVariantChange={handleQ3TourVariantChange}
      onOpenDrawer={jest.fn()}
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

  it("should update the Q3 release tour variant without changing enabled state", async () => {
    const { user, store } = render(<Q3TourSetupHarness />, {
      initialState: withFlagOverrides({
        releaseTour: { enabled: true, params: { variant: "q3_a" } },
      }),
    });

    await user.click(screen.getByText("q3_b"));

    expect(selectFeature(store.getState(), "releaseTour")).toEqual({
      enabled: true,
      params: { variant: "q3_b" },
    });
  });

  it("should enable Open Drawer when the tour has not been seen", () => {
    render(<Q3TourSetupHarness />, {
      initialState: withFlagOverrides({
        releaseTour: { enabled: true, params: { variant: "q3_a" } },
      }),
    });

    expect(screen.getByRole("button", { name: /open drawer/i })).toBeEnabled();
  });
});
