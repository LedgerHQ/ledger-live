import type { BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  BottomSheetErrorGradient,
  BottomSheetInfoGradient,
  BottomSheetSuccessGradient,
  bottomSheetGradientByTone,
} from ".";

const backgroundProps = { style: {} } as BottomSheetBackgroundProps;

describe("BottomSheetGradient", () => {
  it.each([
    ["error", BottomSheetErrorGradient],
    ["info", BottomSheetInfoGradient],
    ["success", BottomSheetSuccessGradient],
  ] as const)(
    "GIVEN the %s bottom-sheet gradient component WHEN it is rendered THEN it shows the matching status gradient asset",
    (tone, Component) => {
      // GIVEN
      // (Component, tone)

      // WHEN
      render(<Component {...backgroundProps} />);

      // THEN
      expect(screen.getByTestId(`bottom-sheet-status-gradient-${tone}`)).toBeVisible();
    },
  );

  it("GIVEN the bottomSheetGradientByTone map WHEN each tone is looked up THEN it returns its dedicated background component", () => {
    // GIVEN / WHEN / THEN
    expect(bottomSheetGradientByTone.error).toBe(BottomSheetErrorGradient);
    expect(bottomSheetGradientByTone.info).toBe(BottomSheetInfoGradient);
    expect(bottomSheetGradientByTone.success).toBe(BottomSheetSuccessGradient);
  });
});
