import { renderHook } from "@testing-library/react";
import { mockUsdcAssetsData } from "@domain/api-aggregated-assets/mock";
import { useChunkedAssetsData } from "@features/platform-aggregated-assets";
import { useAnalyticsCatalog } from "./useAnalyticsCatalog";
import {
  createAnalyticsAccount,
  createAnalyticsToken,
  type MockOperation,
} from "../analyticsSources.mock";

jest.mock("@features/platform-aggregated-assets", () => ({
  ...jest.requireActual("@features/platform-aggregated-assets"),
  useChunkedAssetsData: jest.fn(),
}));

type AssetsQuery = ReturnType<typeof useChunkedAssetsData>;

const refetch = jest.fn();
const assetsQuery: Pick<AssetsQuery, "data" | "isSuccess" | "isError" | "refetch"> = {
  data: mockUsdcAssetsData,
  isSuccess: true,
  isError: false,
  refetch,
};
jest.mocked(useChunkedAssetsData).mockReturnValue(assetsQuery as AssetsQuery);

const eth = createAnalyticsAccount("catalog-hook-eth");
const usdc = createAnalyticsToken(eth);
const isConfirmed = (operation: MockOperation) => operation.isConfirmed;

function renderCatalog(accounts = [{ ...eth, subAccounts: [usdc] }]) {
  return renderHook(() =>
    useAnalyticsCatalog({
      accounts,
      accountNames: accounts.map(() => "Savings"),
      blacklistedIds: [],
      isConfirmed,
      product: "llm",
      version: "1.0.0",
    }),
  );
}

describe("useAnalyticsCatalog", () => {
  it("should request the eligible currencies and build the catalog from the response", () => {
    const { result } = renderCatalog();

    expect(useChunkedAssetsData).toHaveBeenLastCalledWith({
      currencyIds: ["ethereum", usdc.token.id],
      product: "llm",
      version: "1.0.0",
      skip: false,
    });
    expect(result.current.positions.map(position => position.id)).toEqual([eth.id, usdc.id]);
    if (result.current.catalog.status !== "ready") throw new Error("Expected a ready catalog");
    expect(result.current.catalog.data.accounts.map(account => account.name)).toEqual(["Savings"]);
    expect(result.current.refreshCatalog).toBe(refetch);
  });

  it("should skip the request and offer no refresh without an eligible position", () => {
    const { result } = renderCatalog([]);

    expect(useChunkedAssetsData).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }));
    expect(result.current.catalog).toEqual({
      status: "ready",
      data: { assets: [], accounts: [], positions: [] },
    });
    expect(result.current.refreshCatalog).toBeUndefined();
  });
});
