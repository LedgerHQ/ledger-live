import React from "react";
import { Platform, StyleSheet } from "react-native";
import { render } from "@tests/test-renderer";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { rgba } from "@ledgerhq/native-ui/styles/helpers";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomFadeGradient, GRADIENT_LOCATIONS } from "../index";
import { GRADIENT_HEIGHT } from "LLM/features/OperationsHistory/const";

const TEST_ID = "bottom-fade-gradient";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const linearGradientMock = LinearGradient as unknown as jest.Mock;

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
    linearGradientMock.mockClear();
    Platform.OS = "ios";
  });

  afterEach(() => {
    Platform.OS = platform;
  });

  it("feeds LinearGradient theme fade colors and stop positions", () => {
    const base = ledgerLiveThemes.dark.colors.bg.base;
    renderWithBottomInset(0);

    const gradientProps = linearGradientMock.mock.calls.at(-1)?.[0];
    expect(gradientProps).toMatchObject({
      colors: [rgba(base, 0), rgba(base, 0.3), rgba(base, 0.75), rgba(base, 1)],
      locations: GRADIENT_LOCATIONS,
      pointerEvents: "none",
    });
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
