import { mockUsdcAssetsData } from "@domain/api-aggregated-assets/mock";
import {
  createAnalyticsCatalogState,
  indexAnalyticsAccountNames,
  selectAnalyticsCurrencyIds,
} from "./createAnalyticsCatalogState";
import { createAnalyticsAccount, createAnalyticsToken } from "../analyticsSources.mock";

const eth = createAnalyticsAccount("catalog-state-eth");
const token = createAnalyticsToken(eth);

describe("selectAnalyticsCurrencyIds", () => {
  it("should list each currency once", () => {
    const base = createAnalyticsAccount("catalog-state-base", "base");
    expect(selectAnalyticsCurrencyIds([eth, token, base, eth])).toEqual([
      "ethereum",
      token.token.id,
      "base",
    ]);
  });
});

describe("indexAnalyticsAccountNames", () => {
  it("should key each name by the account at the same index", () => {
    expect(indexAnalyticsAccountNames([{ id: "a" }, { id: "b" }], ["Savings", undefined])).toEqual({
      a: "Savings",
      b: undefined,
    });
  });
});

describe("createAnalyticsCatalogState", () => {
  const input = { positions: [eth], accounts: [eth], namesById: {} };

  it("should be ready and empty without any eligible position", () => {
    expect(
      createAnalyticsCatalogState({
        positions: [],
        accounts: [],
        namesById: {},
        assets: { data: undefined, isSuccess: false, isError: false },
      }),
    ).toEqual({ status: "ready", data: { assets: [], accounts: [], positions: [] } });
  });

  it("should build the catalog once asset metadata is loaded", () => {
    const state = createAnalyticsCatalogState({
      ...input,
      assets: { data: mockUsdcAssetsData, isSuccess: true, isError: false },
    });
    expect(state.status).toBe("ready");
  });

  it.each([
    [false, "loading"],
    [true, "error"],
  ] as const)(
    "should report a missing metadata response with isError %s as %s",
    (isError, status) => {
      expect(
        createAnalyticsCatalogState({
          ...input,
          assets: { data: undefined, isSuccess: false, isError },
        }),
      ).toEqual({ status });
    },
  );
});
