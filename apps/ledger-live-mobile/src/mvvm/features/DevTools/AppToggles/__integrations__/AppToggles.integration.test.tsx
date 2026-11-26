import React from "react";
import { Pressable, Text } from "react-native";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { useSettingsRowsToHide } from "LLM/features/Settings/hooks/useSettingsRowsToHide";
import { useAppTogglesTool } from "../useAppTogglesTool";

/** Stands in for the devtool, which only calls the toggle it receives, and for the Settings. */
function SimulateApolloToggle() {
  const [toggle] = useAppTogglesTool().toggles;
  const rowsToHide = useSettingsRowsToHide();

  return (
    <>
      <Text>{toggle.label}</Text>
      <Pressable testID="simulate-apollo-toggle" onPress={() => toggle.onChange(!toggle.isOn)}>
        <Text>{toggle.isOn ? "On" : "Off"}</Text>
      </Pressable>
      <Text testID="rows-to-hide">{rowsToHide.join(",") || "none"}</Text>
    </>
  );
}

const renderToggle = (params: { hideMyLedgerProvider: boolean; hideMockAppUpdate: boolean }) =>
  render(<SimulateApolloToggle />, {
    overrideInitialState: withFlagOverrides({ newSettings: { enabled: true, params } }),
  });

describe("App toggles: simulate an Apollo device", () => {
  it("is off by default and hides no row while the params are false", () => {
    renderToggle({ hideMyLedgerProvider: false, hideMockAppUpdate: false });

    expect(screen.getByText("Simulate an Apollo device")).toBeVisible();
    expect(screen.getByText("Off")).toBeVisible();
    expect(screen.getByTestId("rows-to-hide")).toHaveTextContent("none");
  });

  it("hides both rows once Apollo is simulated, even while the params are false", async () => {
    const { user } = renderToggle({ hideMyLedgerProvider: false, hideMockAppUpdate: false });

    await user.press(screen.getByTestId("simulate-apollo-toggle"));

    expect(screen.getByText("On")).toBeVisible();
    expect(screen.getByTestId("rows-to-hide")).toHaveTextContent("myLedgerProvider,mockAppUpdate");
  });

  it("hides off Apollo the row whose param is turned on by hand", () => {
    renderToggle({ hideMyLedgerProvider: true, hideMockAppUpdate: false });

    expect(screen.getByText("Off")).toBeVisible();
    expect(screen.getByTestId("rows-to-hide")).toHaveTextContent("myLedgerProvider");
  });

  it("goes back to the params once the simulation is turned off", async () => {
    const { user } = renderToggle({ hideMyLedgerProvider: false, hideMockAppUpdate: true });

    await user.press(screen.getByTestId("simulate-apollo-toggle"));
    expect(screen.getByTestId("rows-to-hide")).toHaveTextContent("myLedgerProvider,mockAppUpdate");

    await user.press(screen.getByTestId("simulate-apollo-toggle"));
    expect(screen.getByTestId("rows-to-hide")).toHaveTextContent("mockAppUpdate");
  });
});
