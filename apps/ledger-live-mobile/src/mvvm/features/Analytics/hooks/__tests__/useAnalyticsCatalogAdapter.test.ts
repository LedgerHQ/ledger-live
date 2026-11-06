import { renderHook, waitFor } from "@tests/test-renderer";
import { useAnalyticsCatalogAdapter } from "../useAnalyticsCatalogAdapter";
import { createAnalyticsAccount } from "../../__fixtures__/accountAnalyticsFixtures";

describe("useAnalyticsCatalogAdapter", () => {
  it("should build a ready catalog of the eligible accounts", async () => {
    const eth = createAnalyticsAccount("catalog-mobile-eth");
    const { result } = renderHook(() => useAnalyticsCatalogAdapter(), {
      overrideInitialState: state => ({
        ...state,
        accounts: { ...state.accounts, active: [eth] },
      }),
    });

    await waitFor(() => expect(result.current.catalog.status).toBe("ready"));
    expect(result.current.positions.map(position => position.id)).toEqual([eth.id]);
    expect(result.current.refreshCatalog).toBeDefined();
  });

  it("should return an empty ready catalog without fetching when no position is eligible", () => {
    const { result } = renderHook(() => useAnalyticsCatalogAdapter(), {
      overrideInitialState: state => ({ ...state, accounts: { ...state.accounts, active: [] } }),
    });
    expect(result.current.catalog).toEqual({
      status: "ready",
      data: { assets: [], accounts: [], positions: [] },
    });
    expect(result.current.refreshCatalog).toBeUndefined();
  });
});
