import { renderHook } from "@testing-library/react";
import { analyticsCatalog } from "../../analytics.mock";
import { useAnalyticsFiltersViewModel } from "../AnalyticsFilters/useAnalyticsFiltersViewModel";
import { matchAnalyticsFilterOption } from "./matchAnalyticsFilterOption";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

function renderAssetOptions() {
  const { result } = renderHook(() =>
    useAnalyticsFiltersViewModel({
      assets: analyticsCatalog.assets,
      accounts: analyticsCatalog.accounts,
      selection: { assetId: null, accountId: null, metric: "balance" },
      labels: {
        assets: "Asset filter",
        accounts: "Account filter",
        allAssets: "All assets",
        allAccounts: "All accounts",
      },
      selectAsset: jest.fn(),
      selectAccount: jest.fn(),
    }),
  );
  return result.current.asset.items;
}

function search(query: string): string[] {
  return renderAssetOptions()
    .filter(option => matchAnalyticsFilterOption(option, query))
    .map(option => option.label);
}

describe("matchAnalyticsFilterOption", () => {
  it("should keep every asset option when the query is blank", () => {
    expect(search("   ")).toEqual(["All assets", "Ethereum", "USD Coin", "Bitcoin"]);
  });

  it("should find an asset by its name whatever the case", () => {
    expect(search("bitCOIN")).toEqual(["Bitcoin"]);
  });

  it("should find an asset by its ticker", () => {
    expect(search("usdc")).toEqual(["USD Coin"]);
  });

  it("should ignore the spaces around the query", () => {
    expect(search(" eth ")).toEqual(["Ethereum"]);
  });

  it("should keep no option when nothing matches", () => {
    expect(search("tron")).toEqual([]);
  });
});
