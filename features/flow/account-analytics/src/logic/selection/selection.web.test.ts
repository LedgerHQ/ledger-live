import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { analyticsCatalog } from "../../analytics.mock";
import {
  DEFAULT_ANALYTICS_SELECTION,
  resolveAnalyticsSelection,
  resolveInitialAnalyticsSelection,
} from "./resolveAnalyticsSelection";
import { selectAnalyticsAccounts, selectAnalyticsPositions } from "./selectAnalyticsPositions";
import { createAnalyticsPnlQueryKey, createAnalyticsQueryKey } from "./createAnalyticsQueryKeys";
import {
  analyticsSelectionReducer,
  INITIAL_ANALYTICS_SELECTION_STATE,
} from "../../state/analyticsSelectionReducer";
import type { AnalyticsQueryContext } from "../../types";

const usd = FiatCurrencyTickerSchema.parse("USD");
const eur = FiatCurrencyTickerSchema.parse("EUR");

describe("Analytics selection", () => {
  it("should select only native ETH when its parent also contains USDC", () => {
    const selection = resolveInitialAnalyticsSelection(
      { accountId: "eth-account", currencyId: "ethereum" },
      analyticsCatalog,
    );
    expect(selectAnalyticsPositions(analyticsCatalog, selection).map(p => p.positionId)).toEqual([
      "eth-native",
    ]);
  });

  it("should aggregate network positions without using their ticker as identity", () => {
    const selection = { ...DEFAULT_ANALYTICS_SELECTION, assetId: "usdc" };
    expect(selectAnalyticsPositions(analyticsCatalog, selection).map(p => p.positionId)).toEqual([
      "eth-usdc",
      "tron-usdc",
    ]);
  });

  it("should preserve the parent account when switching to its token", () => {
    const initialized = analyticsSelectionReducer(INITIAL_ANALYTICS_SELECTION_STATE, {
      type: "reconcile",
      catalog: analyticsCatalog,
      initialSelection: { accountId: "eth-account", currencyId: "ethereum" },
    });
    const state = analyticsSelectionReducer(initialized, {
      type: "selectAsset",
      assetId: "usdc",
      catalog: analyticsCatalog,
    });
    expect(state.selection.accountId).toBe("eth-account");
    expect(
      selectAnalyticsPositions(analyticsCatalog, state.selection).map(p => p.positionId),
    ).toEqual(["eth-usdc"]);
  });

  it("should clear an incompatible account when switching to Bitcoin", () => {
    expect(
      resolveAnalyticsSelection(
        { assetId: "btc", accountId: "eth-account", metric: "balance" },
        analyticsCatalog,
      ),
    ).toEqual({ assetId: "btc", accountId: null, metric: "balance" });
  });

  it("should keep the asset when selecting All accounts", () => {
    const state = analyticsSelectionReducer(
      {
        initialized: true,
        selection: { assetId: "usdc", accountId: "eth-account", metric: "balance" },
      },
      { type: "selectAccount", accountId: null, catalog: analyticsCatalog },
    );
    expect(state.selection).toEqual({ assetId: "usdc", accountId: null, metric: "balance" });
  });

  it("should clear the account when selecting All assets", () => {
    expect(
      resolveAnalyticsSelection(
        { assetId: null, accountId: "eth-account", metric: "total-return" },
        analyticsCatalog,
      ),
    ).toEqual({ assetId: null, accountId: null, metric: "total-return" });
    expect(selectAnalyticsAccounts(analyticsCatalog, null)).toEqual([]);
  });

  it("should distinguish identically named accounts by parent ID", () => {
    expect(selectAnalyticsAccounts(analyticsCatalog, "usdc").map(a => a.id)).toEqual([
      "eth-account",
      "tron-account",
    ]);
    const selected = selectAnalyticsPositions(analyticsCatalog, {
      assetId: "usdc",
      accountId: "tron-account",
    });
    expect(selected.map(p => p.positionId)).toEqual(["tron-usdc"]);
  });

  it("should fall back to All assets when the asset loses its eligible positions", () => {
    expect(
      resolveAnalyticsSelection(
        { assetId: "usdc", accountId: "eth-account", metric: "balance" },
        { ...analyticsCatalog, positions: [] },
      ),
    ).toEqual(DEFAULT_ANALYTICS_SELECTION);
  });

  it("should apply the initial account selection only once", () => {
    let state = analyticsSelectionReducer(INITIAL_ANALYTICS_SELECTION_STATE, {
      type: "reconcile",
      catalog: analyticsCatalog,
      initialSelection: { accountId: "eth-account", currencyId: "ethereum" },
    });
    state = analyticsSelectionReducer(state, {
      type: "selectAsset",
      assetId: "btc",
      catalog: analyticsCatalog,
    });
    state = analyticsSelectionReducer(state, {
      type: "reconcile",
      catalog: analyticsCatalog,
      initialSelection: { accountId: "eth-account", currencyId: "ethereum" },
    });
    expect(state.selection.assetId).toBe("btc");
  });

  it("should keep the same PnL context across chart metric and range changes", () => {
    const context: AnalyticsQueryContext = {
      ...DEFAULT_ANALYTICS_SELECTION,
      fiatCurrencyId: usd,
      period: "1m",
      positionIds: ["eth-native"],
    };
    const changed = { ...context, metric: "total-return" as const };
    expect(createAnalyticsQueryKey(context)).not.toBe(createAnalyticsQueryKey(changed));
    expect(createAnalyticsPnlQueryKey(context)).toBe(createAnalyticsPnlQueryKey(changed));
    expect(createAnalyticsPnlQueryKey(context)).toBe(
      createAnalyticsPnlQueryKey({ ...context, period: "1y" }),
    );
    for (const change of [
      { assetId: "btc" },
      { accountId: "btc-account" },
      { fiatCurrencyId: eur },
      { positionIds: ["btc-native"] },
    ]) {
      expect(createAnalyticsPnlQueryKey(context)).not.toBe(
        createAnalyticsPnlQueryKey({ ...context, ...change }),
      );
    }
  });

  it("should keep query keys stable when positions arrive in a different order without mutating them", () => {
    const positionIds = Object.freeze(["tron-usdc", "btc-native", "eth-native"]);
    const context: AnalyticsQueryContext = {
      ...DEFAULT_ANALYTICS_SELECTION,
      fiatCurrencyId: usd,
      period: "1m",
      positionIds,
    };
    const reordered = { ...context, positionIds: ["eth-native", "tron-usdc", "btc-native"] };
    expect(createAnalyticsQueryKey(context)).toBe(createAnalyticsQueryKey(reordered));
    expect(createAnalyticsPnlQueryKey(context)).toBe(createAnalyticsPnlQueryKey(reordered));
    expect(positionIds).toEqual(["tron-usdc", "btc-native", "eth-native"]);
  });
});
