import React from "react";
import { render } from "@tests/test-renderer";
import { LineChartScrubber } from "../LineChartScrubber";
import type { LineChartPointTooltip, LineChartSeries } from "../types";
import type { ScrubberTooltipContent } from "@ledgerhq/lumen-ui-rnative-visualization";

let buildTooltip: ((dataIndex: number) => ScrubberTooltipContent) | undefined;
let showBeacons: boolean | undefined;

jest.mock("@ledgerhq/lumen-ui-rnative-visualization", () => ({
  Scrubber: (props: { tooltip?: typeof buildTooltip; showBeacons?: boolean }) => {
    buildTooltip = props.tooltip;
    showBeacons = props.showBeacons;
    return null;
  },
}));

const series: LineChartSeries[] = [
  { id: "price", data: [10, null, 30], label: "Price", stroke: "" },
  { id: "volume", data: [1, 2, 3], label: "Volume", stroke: "" },
];

const renderScrubber = (tooltipTitle?: (i: number) => string | undefined, showTooltip?: boolean) =>
  render(
    <LineChartScrubber
      series={series}
      formatValue={v => `$${v}`}
      tooltipTitle={tooltipTitle}
      showTooltip={showTooltip}
    />,
  );

const renderPointOnly = (pointTooltips: ReadonlyMap<number, LineChartPointTooltip>) =>
  render(
    <LineChartScrubber
      series={series}
      formatValue={v => `$${v}`}
      pointTooltips={pointTooltips}
      pointTooltipsOnly
    />,
  );

describe("LineChartScrubber", () => {
  it("builds a row per series with a valid value at the index", () => {
    renderScrubber();
    expect(buildTooltip?.(0)).toMatchObject({
      items: [
        { label: "Price", value: "$10" },
        { label: "Volume", value: "$1" },
      ],
    });
  });

  it("skips series whose value is null or missing", () => {
    renderScrubber();
    expect(buildTooltip?.(1)).toMatchObject({ items: [{ label: "Volume", value: "$2" }] });
  });

  it("pins a content-derived minWidth so values cannot clip labels", () => {
    renderScrubber();
    expect(buildTooltip?.(0)?.minWidth).toBeGreaterThanOrEqual(80);
  });

  it("adds the title when tooltipTitle returns a non-empty string", () => {
    renderScrubber(i => `Point ${i}`);
    expect(buildTooltip?.(2)).toMatchObject({ title: "Point 2" });
  });

  it("omits the title when tooltipTitle is empty or undefined", () => {
    renderScrubber(() => "");
    expect("title" in (buildTooltip?.(2) ?? {})).toBe(false);
  });

  it("renders the tooltip by default", () => {
    renderScrubber();
    expect(buildTooltip).toBeDefined();
    expect(showBeacons).toBe(true);
  });

  it("omits the tooltip but keeps beacons when showTooltip is false", () => {
    renderScrubber(undefined, false);
    expect(buildTooltip).toBeUndefined();
    expect(showBeacons).toBe(true);
  });

  describe("pointTooltipsOnly", () => {
    const pointTooltips = new Map<number, LineChartPointTooltip>([
      [2, { title: "2 transactions", rows: [{ label: "Received", value: "$5" }] }],
    ]);

    it("returns the resolved marker tooltip when the scrubbed index matches a point", () => {
      renderPointOnly(pointTooltips);
      expect(buildTooltip?.(2)).toMatchObject({
        title: "2 transactions",
        items: [{ label: "Received", value: "$5" }],
      });
    });

    it("pins a content-derived minWidth on the resolved marker tooltip", () => {
      renderPointOnly(pointTooltips);
      expect(buildTooltip?.(2)?.minWidth).toBeGreaterThanOrEqual(80);
    });

    it("hides the tooltip (empty items, no per-series rows) away from any point", () => {
      renderPointOnly(pointTooltips);
      expect(buildTooltip?.(0)).toEqual({ items: [] });
    });
  });
});
