import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { ProfileSection } from "../views/ProfileSection";

const withNanoProfileUpsell = withFlagOverrides(
  { largeScreenUpsell: { enabled: true } },
  (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      personalizedRecommendationsEnabled: true,
      knownDeviceModelIds: {
        ...state.settings.knownDeviceModelIds,
        [DeviceModelId.nanoS]: true,
      },
    },
  }),
);

describe("ProfileSection", () => {
  it("should render the avatar without the profile upsell banner", () => {
    render(<ProfileSection />, { overrideInitialState: withNanoProfileUpsell });

    expect(screen.getByTestId("my-wallet-avatar")).toBeVisible();
    expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
  });
});
