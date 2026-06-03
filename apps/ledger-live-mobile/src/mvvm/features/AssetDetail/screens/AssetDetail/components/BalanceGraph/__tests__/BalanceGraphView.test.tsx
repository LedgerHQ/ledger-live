import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { BalanceGraphView } from "../BalanceGraphView";
import type {
  LineChartScrubberPositionChange,
  LineChartSeries,
  LineChartXAxisConfig,
  LineChartYAxisConfig,
} from "LLM/components/LineChart";
import type { RangeKey } from "../../../utils/rangeMapping";

// Capture the props the chart receives so we can assert on the scrub wiring.
const mockLineChartProps: Record<string, unknown> = {};
jest.mock("LLM/components/LineChart", () => ({
  LineChart: (props: Record<string, unknown>) => {
    Object.assign(mockLineChartProps, props);
    return null;
  },
}));

// Override AmountDisplay to expose the `animate` prop (the real one renders an
// odometer that is awkward to assert against).
let mockAmountDisplayAnimate: boolean | undefined;
let mockAmountDisplaySize: "sm" | "md" | undefined;
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const ReactActual = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  return {
    ...actual,
    AmountDisplay: ({
      value,
      animate,
      size,
      testID,
    }: {
      value: number;
      animate?: boolean;
      size?: "sm" | "md";
      testID?: string;
    }) => {
      mockAmountDisplayAnimate = animate;
      mockAmountDisplaySize = size;
      return ReactActual.createElement(Text, { testID }, String(value));
    },
  };
});

const priceFormatter = (value: number): FormattedValue => ({
  integerPart: String(value),
  decimalPart: "",
  decimalSeparator: ".",
  currencyText: "$",
  currencyPosition: "start",
});

const isRangeValue = (value: string): value is RangeKey => value === "1d" || value === "1w";

const series: LineChartSeries[] = [
  { id: "price", data: [100, 110, 120], label: "Price", stroke: "" },
];
const xAxis: LineChartXAxisConfig = {};
const yAxis: LineChartYAxisConfig = {};
const noopScrub: LineChartScrubberPositionChange = jest.fn();

type ViewProps = Parameters<typeof BalanceGraphView>[0];

const buildProps = (overrides: Partial<ViewProps> = {}): ViewProps => ({
  price: 50000,
  priceFormatter,
  hasMarketData: true,
  priceChangePercentage: 2.35,
  formattedPriceChange: "+$1,000.00",
  timeLabel: "Today",
  ranges: [
    { label: "1D", value: "1d" },
    { label: "1W", value: "1w" },
  ],
  selectedRange: "1d",
  onRangeChange: jest.fn(),
  isRangeValue,
  showReceive: false,
  onReceivePress: jest.fn(),
  isLoading: false,
  series,
  chartColor: "success",
  points: [],
  pointTooltipsOnly: true,
  formatValue: (value: number) => String(value),
  tooltipTitle: () => undefined,
  onScrubberPositionChange: noopScrub,
  isScrubbing: false,
  showXAxis: false,
  showYAxis: false,
  xAxis,
  yAxis,
  ...overrides,
});

describe("BalanceGraphView", () => {
  beforeEach(() => {
    mockAmountDisplayAnimate = undefined;
    mockAmountDisplaySize = undefined;
    for (const key of Object.keys(mockLineChartProps)) delete mockLineChartProps[key];
  });

  it("forwards the scrub callback, enables point-only tooltips and keeps beacons hidden", () => {
    const onScrubberPositionChange: LineChartScrubberPositionChange = jest.fn();
    const points = [{ index: 1, value: 110, color: "success" as const, tooltip: { rows: [] } }];
    render(<BalanceGraphView {...buildProps({ onScrubberPositionChange, points })} />);

    expect(mockLineChartProps.onScrubberPositionChange).toBe(onScrubberPositionChange);
    expect(mockLineChartProps.showScrubberTooltip).toBe(true);
    expect(mockLineChartProps.showScrubberBeacons).toBe(false);
    expect(mockLineChartProps.pointTooltipsOnly).toBe(true);
    expect(mockLineChartProps.points).toBe(points);
  });

  describe("when not scrubbing", () => {
    it("animates the amount and shows the range label with the variation and percentage", () => {
      render(<BalanceGraphView {...buildProps()} />);

      expect(mockAmountDisplayAnimate).toBe(true);
      expect(mockAmountDisplaySize).toBe("md");
      expect(screen.getByText("Today")).toBeVisible();
      expect(screen.getByText("2.35%")).toBeVisible();
      expect(screen.getByText("+$1,000.00")).toBeVisible();
    });
  });

  describe("while scrubbing", () => {
    it("disables the amount animation and shows the scrubbed variation, fiat change and date", () => {
      render(
        <BalanceGraphView
          {...buildProps({
            isScrubbing: true,
            priceChangePercentage: 1.8,
            formattedPriceChange: "+$220.00",
            timeLabel: "5/29/2026",
          })}
        />,
      );

      expect(mockAmountDisplayAnimate).toBe(false);
      expect(screen.getByText("1.80%")).toBeVisible();
      expect(screen.getByText("+$220.00")).toBeVisible();
      expect(screen.getByText("5/29/2026")).toBeVisible();
      expect(screen.queryByText("Today")).toBeNull();
    });
  });
});
