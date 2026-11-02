import React from "react";
import { StyleSheet, Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import PerpsNavigator from "../PerpsNavigator";

jest.mock("LLM/features/Perps", () => ({
  PerpsLiveAppWrapper: () => <Text testID="perps-live-app-wrapper">Perps Live App</Text>,
}));

const LUMEN_DARK_CANVAS = "#000000";

function getClosestBackgroundColor(testID: string) {
  let node = screen.getByTestId(testID).parent;
  while (node) {
    const { backgroundColor } = StyleSheet.flatten(node.props.style) ?? {};
    if (backgroundColor) return backgroundColor;
    node = node.parent;
  }
  return undefined;
}

describe("PerpsNavigator", () => {
  it("renders the perps live app screen", () => {
    render(<PerpsNavigator />);

    expect(screen.getByTestId("perps-live-app-wrapper")).toBeOnTheScreen();
  });

  it("paints the screen with the Lumen canvas so the bottom safe area matches the live app", () => {
    render(<PerpsNavigator />);

    expect(getClosestBackgroundColor("perps-live-app-wrapper")).toBe(LUMEN_DARK_CANVAS);
  });
});
