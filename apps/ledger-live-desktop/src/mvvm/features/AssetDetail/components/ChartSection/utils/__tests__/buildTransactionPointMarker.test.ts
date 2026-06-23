import { buildTransactionPointMarker } from "../buildTransactionPointMarker";
import type { TransactionChartGroup } from "@ledgerhq/asset-detail";

const t = (key: string, options?: { count: number }) => (options ? `${key}:${options.count}` : key);

const formatFiat = (value: number) => `$${value}`;

const baseGroup: TransactionChartGroup = {
  index: 4,
  value: 100,
  dateMs: 0,
  receivedCount: 0,
  sentCount: 0,
  receivedFiat: 0,
  sentFiat: 0,
};

describe("buildTransactionPointMarker", () => {
  it("colors a single received transaction green (success) with a Received row and no title", () => {
    const marker = buildTransactionPointMarker(
      { ...baseGroup, receivedCount: 1, receivedFiat: 25 },
      t,
      formatFiat,
    );

    expect(marker.color).toBe("success");
    expect(marker.hidePoint).toBe(false);
    expect(marker.hideLabel).toBe(true);
    expect(marker.tooltip?.title).toBeUndefined();
    expect(marker.tooltip?.rows).toEqual([{ label: "assetDetails.chart.received", value: "$25" }]);
  });

  it("colors a single sent transaction red (error) with a Sent row", () => {
    const marker = buildTransactionPointMarker(
      { ...baseGroup, sentCount: 1, sentFiat: 40 },
      t,
      formatFiat,
    );

    expect(marker.color).toBe("error");
    expect(marker.tooltip?.rows).toEqual([{ label: "assetDetails.chart.sent", value: "$40" }]);
  });

  it("colors a point with multiple transactions muted and adds a count title with both rows", () => {
    const marker = buildTransactionPointMarker(
      { ...baseGroup, receivedCount: 1, receivedFiat: 25, sentCount: 2, sentFiat: 40 },
      t,
      formatFiat,
    );

    expect(marker.color).toBe("muted");
    expect(marker.tooltip?.title).toBe("assetDetails.chart.transactionsCount:3");
    expect(marker.tooltip?.rows).toEqual([
      { label: "assetDetails.chart.received", value: "$25" },
      { label: "assetDetails.chart.sent", value: "$40" },
    ]);
  });

  it("keeps the marker anchored to the group's chart index and value", () => {
    const marker = buildTransactionPointMarker(
      { ...baseGroup, index: 7, value: 321, receivedCount: 1 },
      t,
      formatFiat,
    );

    expect(marker.index).toBe(7);
    expect(marker.value).toBe(321);
  });

  it("omits tooltip rows for directions with no activity", () => {
    const marker = buildTransactionPointMarker(
      { ...baseGroup, sentCount: 1, sentFiat: 12 },
      t,
      formatFiat,
    );

    expect(marker.tooltip?.rows).toEqual([{ label: "assetDetails.chart.sent", value: "$12" }]);
  });
});
