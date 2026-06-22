import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { FittedAmountDisplay, getAmountDisplayScale, getScaleFromWidth } from "../index";

const wideFormatter = (): FormattedValue => ({
  integerPart: "1,234,557,688,901",
  decimalPart: "98",
  currencyText: "ل.ل",
  currencyPosition: "start",
  decimalSeparator: ".",
});

const hidden = { includeHiddenElements: true } as const;

describe("getAmountDisplayScale", () => {
  it("should return 1 when the estimate fits", () => {
    expect(getAmountDisplayScale("$1,234.56", 358)).toBe(1);
  });

  it("should return a scale below 1 for a wide amount", () => {
    expect(getAmountDisplayScale("ل.ل1,234,557,688,901.98", 358)).toBeLessThan(1);
  });
});

describe("getScaleFromWidth", () => {
  it("should return 1 when content fits", () => {
    expect(getScaleFromWidth(300, 358)).toBe(1);
  });

  it("should scale down when content is wider than the fit width", () => {
    expect(getScaleFromWidth(500, 358)).toBeCloseTo(0.688);
  });

  it("should prefer the estimated scale over a stale small measurement when revealing a wide amount", () => {
    const fullText = "ل.ل1,234,557,688,901.98";
    const estimated = getAmountDisplayScale(fullText, 358);
    const staleDiscreetMeasurement = getScaleFromWidth(80, 358);

    expect(estimated).toBeLessThan(1);
    expect(staleDiscreetMeasurement).toBe(1);
    expect(Math.min(estimated, staleDiscreetMeasurement)).toBe(estimated);
  });
});

describe("FittedAmountDisplay", () => {
  it("should render AmountDisplay when the amount fits", () => {
    render(
      <FittedAmountDisplay
        value={1234.56}
        formatter={() => ({
          integerPart: "1,234",
          decimalPart: "56",
          currencyText: "$",
          currencyPosition: "start",
          decimalSeparator: ".",
        })}
        testID="portfolio-balance-amount"
      />,
    );

    expect(screen.getByTestId("portfolio-balance-amount")).toBeVisible();
    expect(screen.getByText("$", hidden)).toBeTruthy();
  });

  it("should render AmountDisplay for a wide amount", () => {
    render(
      <FittedAmountDisplay
        value={123455768890190.98}
        formatter={wideFormatter}
        testID="portfolio-balance-amount"
      />,
    );

    expect(screen.getByTestId("portfolio-balance-amount")).toBeVisible();
    expect(screen.getByText("ل.ل", hidden)).toBeTruthy();
  });
});
