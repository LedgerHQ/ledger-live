import React from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { render, screen, withFlagOverrides } from "tests/testSetup";

/**
 * Reads a flag through live-common's Context-based `useFeature`. The
 * `FeatureFlagsContextBridge` (mounted by the test renderer) must surface the Redux
 * slice's resolved value to this legacy Context consumer.
 */
function FlagProbe() {
  const feature = useFeature("currencyAleo");
  return <div data-testid="probe">{feature?.enabled ? "enabled" : "disabled"}</div>;
}

describe("FeatureFlagsContextBridge", () => {
  it("surfaces the slice's resolved value to live-common's useFeature when enabled", () => {
    render(<FlagProbe />, {
      initialState: withFlagOverrides({ currencyAleo: { enabled: true } }),
      skipRouter: true,
    });
    expect(screen.getByTestId("probe")).toHaveTextContent("enabled");
  });

  it("surfaces the slice's resolved value to live-common's useFeature when disabled", () => {
    render(<FlagProbe />, {
      initialState: withFlagOverrides({ currencyAleo: { enabled: false } }),
      skipRouter: true,
    });
    expect(screen.getByTestId("probe")).toHaveTextContent("disabled");
  });
});
