import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import {
  dismissPredictionsSetup,
  startPredictionsSetup,
} from "../../predictionsSetupStore.internals";
import { PredictionsSetupSheet } from "./PredictionsSetupSheet";

type BackPressHandler = () => boolean | null | undefined;

const mockBackPressHandlers: BackPressHandler[] = [];

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  BackHandler: {
    addEventListener: (_event: string, handler: BackPressHandler) => {
      mockBackPressHandlers.push(handler);
      return {
        remove: () => {
          const index = mockBackPressHandlers.indexOf(handler);
          if (index !== -1) mockBackPressHandlers.splice(index, 1);
        },
      };
    },
  },
}));

const isSheetOpen = () =>
  screen.getByTestId("predictions-setup-sheet").props.accessibilityState.expanded === true;

describe("PredictionsSetupSheet (native)", () => {
  afterEach(() => {
    act(() => dismissPredictionsSetup());
    mockBackPressHandlers.length = 0;
  });

  it("leaves the Android back alone while no setup is open", () => {
    render(<PredictionsSetupSheet />, { wrapper: I18nWrapper });

    expect(isSheetOpen()).toBe(false);
    expect(mockBackPressHandlers).toHaveLength(0);
  });

  it("closes when the user presses the Android back button", () => {
    render(<PredictionsSetupSheet />, { wrapper: I18nWrapper });
    act(() => {
      startPredictionsSetup();
    });

    let isConsumed: boolean | null | undefined;
    act(() => {
      isConsumed = mockBackPressHandlers.at(-1)?.();
    });

    expect(isConsumed).toBe(true);
    expect(isSheetOpen()).toBe(false);
    expect(mockBackPressHandlers).toHaveLength(0);
  });
});
