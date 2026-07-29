import type { Unit } from "@domain/entity-currency-unit";
import {
  createFiatLineChartValueFormatter,
  createSmallestUnitFiatLineChartValueFormatter,
} from "../utils/createFiatLineChartValueFormatter";

const usdUnit: Unit = {
  code: "$",
  name: "US Dollar",
  magnitude: 2,
  showAllDigits: true,
  prefixCode: true,
};

describe("createFiatLineChartValueFormatter", () => {
  it("formats a value expressed in the main/display unit (e.g. a market price)", () => {
    const formatValue = createFiatLineChartValueFormatter(usdUnit, "en-US");
    expect(formatValue(50_000)).toBe("$50,000.00");
  });

  it("masks the value in discreet mode", () => {
    const formatValue = createFiatLineChartValueFormatter(usdUnit, "en-US", true);
    expect(formatValue(50_000)).toBe("$***");
  });
});

describe("createSmallestUnitFiatLineChartValueFormatter", () => {
  it("formats a value already expressed in the unit's smallest atom (e.g. portfolio countervalue data)", () => {
    const formatValue = createSmallestUnitFiatLineChartValueFormatter(usdUnit, "en-US");
    expect(formatValue(5_000_000)).toBe("$50,000.00");
  });

  it("masks the value in discreet mode", () => {
    const formatValue = createSmallestUnitFiatLineChartValueFormatter(usdUnit, "en-US", true);
    expect(formatValue(5_000_000)).toBe("$***");
  });

  it("does not apply the x100 magnitude shift performed by the main-unit formatter", () => {
    const smallestUnitFormatter = createSmallestUnitFiatLineChartValueFormatter(usdUnit, "en-US");
    const mainUnitFormatter = createFiatLineChartValueFormatter(usdUnit, "en-US");
    expect(smallestUnitFormatter(5_000_000)).toBe(mainUnitFormatter(50_000));
  });
});
