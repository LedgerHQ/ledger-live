import { buildTransactionPointMarker } from "../utils/buildTransactionPointMarker";
import type { LineChartColor } from "LLM/components/LineChart";
import type { TransactionChartGroup } from "../utils/getTransactionPointMarkers";

const t = (key: string, options?: { count: number }) => (options ? `${key}:${options.count}` : key);
const formatFiat = (value: number) => `$${value}`;
const KEY = "assetDetail.balanceGraph.chart";

const group = (overrides: Partial<TransactionChartGroup>): TransactionChartGroup => ({
  index: 2,
  value: 30,
  dateMs: 0,
  receivedCount: 0,
  sentCount: 0,
  receivedFiat: 0,
  sentFiat: 0,
  ...overrides,
});

type Row = { label: string; value: string };

describe("buildTransactionPointMarker", () => {
  it.each<[string, Partial<TransactionChartGroup>, LineChartColor, string | undefined, Row[]]>([
    [
      "single received → green, no title, Received row",
      { receivedCount: 1, receivedFiat: 12 },
      "success",
      undefined,
      [{ label: `${KEY}.received`, value: "$12" }],
    ],
    [
      "single sent → red, no title, Sent row",
      { sentCount: 1, sentFiat: 7 },
      "error",
      undefined,
      [{ label: `${KEY}.sent`, value: "$7" }],
    ],
    [
      "cluster → grey, count title, both rows",
      { receivedCount: 2, sentCount: 1, receivedFiat: 5, sentFiat: 3 },
      "muted",
      `${KEY}.transactionsCount:3`,
      [
        { label: `${KEY}.received`, value: "$5" },
        { label: `${KEY}.sent`, value: "$3" },
      ],
    ],
  ])("%s", (_label, overrides, color, title, rows) => {
    expect(buildTransactionPointMarker(group(overrides), t, formatFiat)).toEqual({
      index: 2,
      value: 30,
      color,
      hidePoint: false,
      hideLabel: true,
      tooltip: { title, rows },
    });
  });
});
