import React from "react";
import { render, screen } from "@tests/test-renderer";
import statusGradientError from "./assets/status-gradient-error.webp";
import statusGradientInfo from "./assets/status-gradient-info.webp";
import statusGradientSuccess from "./assets/status-gradient-success.webp";
import { StatusGradient, type StatusGradientTone } from ".";

const EXPECTED_ASSET_BY_TONE: Record<StatusGradientTone, unknown> = {
  error: statusGradientError,
  info: statusGradientInfo,
  success: statusGradientSuccess,
};

const TONES: readonly StatusGradientTone[] = ["error", "info", "success"];

describe("StatusGradient", () => {
  it.each(TONES)(
    "GIVEN the StatusGradient with the %s tone WHEN it is rendered THEN its image source is the matching gradient asset",
    tone => {
      // GIVEN
      // (tone)

      // WHEN
      render(<StatusGradient tone={tone} testID="status-gradient" />);

      // THEN
      expect(screen.getByTestId("status-gradient").props.source).toBe(EXPECTED_ASSET_BY_TONE[tone]);
    },
  );
});
