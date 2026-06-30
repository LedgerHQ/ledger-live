import { Order } from "@ledgerhq/live-common/market/utils/types";
import { renderHook } from "tests/testSetup";
import { trackPage } from "~/renderer/analytics/segment";
import {
  getMarketDiscoverabilityPageAnalytics,
  getMarketPageCategoryAnalytics,
  getMarketPageSortAnalytics,
  getMarketPageTimeframeAnalytics,
  getMarketSortDirection,
  getMarketSortListAnalytics,
  getMarketSortToggleValue,
  useTrackMarketDiscoverabilityPage,
} from "../marketPageAnalytics";

jest.mock("~/renderer/analytics/segment", () => ({
  trackPage: jest.fn(),
}));

describe("marketPageAnalytics", () => {
  beforeEach(() => {
    jest.mocked(trackPage).mockReset();
  });

  describe("getMarketSortDirection", () => {
    it("returns desc when order matches the desc order", () => {
      expect(
        getMarketSortDirection(Order.MarketCapDesc, Order.MarketCapDesc, Order.MarketCapAsc),
      ).toBe("desc");
    });

    it("returns asc when order matches the asc order", () => {
      expect(getMarketSortDirection(Order.VolumeAsc, Order.VolumeDesc, Order.VolumeAsc)).toBe(
        "asc",
      );
    });

    it("returns undefined when order does not match either sort order", () => {
      expect(
        getMarketSortDirection(Order.MarketCapDesc, Order.VolumeDesc, Order.VolumeAsc),
      ).toBeUndefined();
    });
  });

  describe("getMarketPageTimeframeAnalytics", () => {
    it.each([
      ["24h", "1D"],
      ["7d", "7D"],
      ["30d", "30D"],
      ["6m", "6M"],
      ["1y", "1Y"],
    ] as const)("maps %s to %s", (range, expected) => {
      expect(getMarketPageTimeframeAnalytics(range)).toBe(expected);
    });

    it("returns undefined when range is missing", () => {
      expect(getMarketPageTimeframeAnalytics(undefined)).toBeUndefined();
    });
  });

  describe("getMarketPageCategoryAnalytics", () => {
    it("maps starred to favorites", () => {
      expect(getMarketPageCategoryAnalytics("starred")).toBe("favorites");
    });

    it("keeps other built-in categories unchanged", () => {
      expect(getMarketPageCategoryAnalytics("all")).toBe("all");
      expect(getMarketPageCategoryAnalytics("stocks")).toBe("stocks");
    });

    it("keeps trending category ids unchanged", () => {
      expect(getMarketPageCategoryAnalytics("infrastructure")).toBe("infrastructure");
    });
  });

  describe("getMarketPageSortAnalytics", () => {
    it("returns desc as the default when the column is not actively sorted", () => {
      expect(
        getMarketPageSortAnalytics(Order.MarketCapDesc, Order.VolumeDesc, Order.VolumeAsc),
      ).toBe("desc");
    });

    it("returns asc when the column is actively sorted ascending", () => {
      expect(getMarketPageSortAnalytics(Order.VolumeAsc, Order.VolumeDesc, Order.VolumeAsc)).toBe(
        "asc",
      );
    });
  });

  describe("getMarketSortToggleValue", () => {
    it("returns true_desc when the column is sorted descending", () => {
      expect(getMarketSortToggleValue(Order.VolumeDesc, Order.VolumeDesc, Order.VolumeAsc)).toBe(
        "true_desc",
      );
    });

    it("returns true_asc when the column is sorted ascending", () => {
      expect(getMarketSortToggleValue(Order.VolumeAsc, Order.VolumeDesc, Order.VolumeAsc)).toBe(
        "true_asc",
      );
    });

    it("returns false when the column is not the active sort", () => {
      expect(getMarketSortToggleValue(Order.MarketCapDesc, Order.VolumeDesc, Order.VolumeAsc)).toBe(
        "false",
      );
    });
  });

  describe("getMarketSortListAnalytics", () => {
    it("marks only the active column and maps the timeframe", () => {
      expect(getMarketSortListAnalytics({ order: Order.topLosers, range: "24h" })).toEqual({
        sortVolume: "false",
        sortMarketCap: "false",
        sortChange: "true_asc",
        timeframe: "1D",
      });
    });
  });

  describe("getMarketDiscoverabilityPageAnalytics", () => {
    it("returns sort directions and mapped filters", () => {
      expect(
        getMarketDiscoverabilityPageAnalytics({
          order: Order.MarketCapDesc,
          range: "7d",
          category: "starred",
        }),
      ).toEqual({
        sortVolume: "desc",
        sortMarketCap: "desc",
        sortChange: "desc",
        timeframe: "7D",
        category: "favorites",
      });
    });
  });

  describe("useTrackMarketDiscoverabilityPage", () => {
    it("tracks Page Market with category as an event property", () => {
      renderHook(() =>
        useTrackMarketDiscoverabilityPage(true, {
          order: Order.MarketCapDesc,
          range: "7d",
          category: "starred",
        }),
      );

      expect(trackPage).toHaveBeenCalledWith(
        "Market",
        undefined,
        {
          sortVolume: "desc",
          sortMarketCap: "desc",
          sortChange: "desc",
          timeframe: "7D",
          category: "favorites",
        },
        true,
        true,
        false,
      );
    });

    it("does not track when discoverability is disabled", () => {
      renderHook(() =>
        useTrackMarketDiscoverabilityPage(false, {
          order: Order.MarketCapDesc,
          range: "7d",
          category: "all",
        }),
      );

      expect(trackPage).not.toHaveBeenCalled();
    });
  });
});
