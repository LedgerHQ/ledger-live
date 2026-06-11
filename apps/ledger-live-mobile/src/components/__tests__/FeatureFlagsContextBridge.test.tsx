import React from "react";
import { Text } from "react-native";
import { screen } from "@testing-library/react-native";
import { render, withFlagOverrides } from "@tests/test-renderer";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

/**
 * Reads a flag through live-common's Context-based `useFeature`. The
 * `FeatureFlagsContextBridge` (mounted by the test renderer) must surface the Redux
 * slice's resolved value to this legacy Context consumer.
 */
function FlagProbe() {
  const feature = useFeature("lwmWallet40");
  return <Text>{feature?.enabled ? "enabled" : "disabled"}</Text>;
}

describe("FeatureFlagsContextBridge", () => {
  it("surfaces the slice's resolved value to live-common's useFeature when enabled", () => {
    render(<FlagProbe />, {
      overrideInitialState: withFlagOverrides({ lwmWallet40: { enabled: true } }),
    });
    expect(screen.getByText("enabled")).toBeTruthy();
  });

  it("surfaces the slice's resolved value to live-common's useFeature when disabled", () => {
    render(<FlagProbe />, {
      overrideInitialState: withFlagOverrides({ lwmWallet40: { enabled: false } }),
    });
    expect(screen.getByText("disabled")).toBeTruthy();
  });
});
