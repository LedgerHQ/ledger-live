import { estimateTooltipMinWidth } from "../utils/estimateTooltipMinWidth";
import type { LineChartPointTooltip } from "../types";

describe("estimateTooltipMinWidth", () => {
  it("never returns less than the default floor", () => {
    expect(estimateTooltipMinWidth({ rows: [] })).toBe(80);
    expect(estimateTooltipMinWidth({ rows: [{ label: "a", value: "1" }] })).toBe(80);
  });

  it("reserves room for the widest label/value row", () => {
    // (label "Received" 8 + value "$1.02" 5) * 8px + gap(12) + padding(16) = 132
    const tooltip: LineChartPointTooltip = {
      rows: [{ label: "Received", value: "$1.02" }],
    };
    expect(estimateTooltipMinWidth(tooltip)).toBe(132);
  });

  it("accounts for the title width", () => {
    // "15 transactions" = 15 chars * 8 + padding(16) = 136
    const tooltip: LineChartPointTooltip = {
      title: "15 transactions",
      rows: [{ label: "Sent", value: "$1" }],
    };
    expect(estimateTooltipMinWidth(tooltip)).toBe(136);
  });

  it("takes the maximum across the title and every row", () => {
    const tooltip: LineChartPointTooltip = {
      title: "9 transactions",
      rows: [
        { label: "Received", value: "$1,234,567.89" },
        { label: "Sent", value: "$0.13" },
      ],
    };
    // widest row: "Received"(8) + "$1,234,567.89"(13) = 21 chars * 8 + 12 + 16 = 196
    expect(estimateTooltipMinWidth(tooltip)).toBe(196);
  });

  it("grows with longer fiat values so they never clip the label", () => {
    const shortValue = estimateTooltipMinWidth({ rows: [{ label: "Received", value: "$1" }] });
    const longValue = estimateTooltipMinWidth({
      rows: [{ label: "Received", value: "$1,234,567.89" }],
    });
    expect(longValue).toBeGreaterThan(shortValue);
  });
});
