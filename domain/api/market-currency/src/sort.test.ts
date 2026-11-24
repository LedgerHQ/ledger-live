import { Order } from "@domain/entity-market-currency";
import { getRange, getSortParam } from "./sort";

describe("getRange", () => {
  it.each([
    ["24h", "1d"],
    ["day", "1d"],
    ["7d", "1w"],
    ["week", "1w"],
    ["30d", "1m"],
    ["6m", "6m"],
    ["1y", "1y"],
    ["all", "1y"],
  ])("maps %s to %s", (range, segment) => {
    expect(getRange(range)).toBe(segment);
  });

  it("has no segment for an unknown range", () => {
    expect(getRange("unknown")).toBeUndefined();
  });
});

describe("getSortParam", () => {
  it.each([
    [Order.MarketCapDesc, "24h", "market-cap-rank"],
    [Order.MarketCapAsc, "24h", "market-cap-rank-desc"],
    [Order.topLosers, "7d", "negative-price-change-1w"],
    [Order.topGainers, "30d", "positive-price-change-1m"],
    [Order.VolumeDesc, "24h", "total-volume-desc"],
    [Order.VolumeAsc, "24h", "total-volume"],
  ])("sorts %s over %s as %s", (order, range, sort) => {
    expect(getSortParam(order, range)).toBe(sort);
  });
});
