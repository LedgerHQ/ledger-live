import React from "react";
import { Platform, StyleSheet } from "react-native";
import { render } from "@tests/test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "../index";

const TEST_ID = "bottom-fade-gradient";

function renderWithBottomInset(bottom: number) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 0, left: 0, right: 0, bottom },
      }}
    >
      <BottomFadeGradient />
    </SafeAreaProvider>,
  );
}

function containerHeight(getByTestId: ReturnType<typeof render>["getByTestId"]) {
  return StyleSheet.flatten(getByTestId(TEST_ID).props.style).height;
}

describe("BottomFadeGradient", () => {
  const platform = Platform.OS;

  beforeEach(() => {
    Platform.OS = "ios";
  });

  afterEach(() => {
    Platform.OS = platform;
  });

  it("extends container height with bottom inset on iOS", () => {
    const { getByTestId } = renderWithBottomInset(34);
    expect(containerHeight(getByTestId)).toBe(GRADIENT_HEIGHT + 34);
  });

  it("keeps container height fixed on Android", () => {
    Platform.OS = "android";
    const { getByTestId } = renderWithBottomInset(48);
    expect(containerHeight(getByTestId)).toBe(GRADIENT_HEIGHT);
  });
});
