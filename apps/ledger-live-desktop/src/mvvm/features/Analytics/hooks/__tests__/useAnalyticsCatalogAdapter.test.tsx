import { renderHook, waitFor } from "tests/testSetup";
import { http, HttpResponse, server } from "tests/server";
import assetResponse from "tests/handlers/fixtures/assets/getAssets.json";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { useAnalyticsCatalogAdapter } from "../useAnalyticsCatalogAdapter";
import { createAnalyticsAccount } from "../../__fixtures__/analyticsFixtures";

describe("useAnalyticsCatalogAdapter", () => {
  it("should build a ready catalog grouping eligible accounts by asset metadata", async () => {
    server.use(http.get("*/assets", () => HttpResponse.json(assetResponse)));
    const eth = createAnalyticsAccount("catalog-eth");
    const base = createAnalyticsAccount("catalog-base", "base");

    const { result } = renderHook(() => useAnalyticsCatalogAdapter(), {
      initialState: { accounts: [eth, base], settings: AFTER_ONBOARDING_STATE },
    });

    await waitFor(() => expect(result.current.catalog.status).toBe("ready"));
    if (result.current.catalog.status !== "ready") throw new Error("Expected a ready catalog");
    expect(result.current.catalog.data.positions.map(p => p.positionId)).toEqual([eth.id, base.id]);
    expect(result.current.catalog.data.accounts).toHaveLength(2);
  });

  it("should return an empty ready catalog without fetching when no position is eligible", () => {
    const { result } = renderHook(() => useAnalyticsCatalogAdapter(), {
      initialState: { accounts: [], settings: AFTER_ONBOARDING_STATE },
    });
    expect(result.current.catalog).toEqual({
      status: "ready",
      data: { assets: [], accounts: [], positions: [] },
    });
    expect(result.current.refreshCatalog).toBeUndefined();
  });
});
