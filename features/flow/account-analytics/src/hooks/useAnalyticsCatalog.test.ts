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

const mockUseChunkedAssetsData = jest.mocked(useChunkedAssetsData);
const refetch = jest.fn();

function mockAssets(overrides: Partial<ReturnType<typeof useChunkedAssetsData>> = {}) {
  mockUseChunkedAssetsData.mockReturnValue({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: undefined,
    errorInfo: undefined,
    refetch,
    ...overrides,
  } as ReturnType<typeof useChunkedAssetsData>);
}

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
  beforeEach(() => jest.clearAllMocks());

  it("should request the asset metadata of every eligible currency", () => {
    mockAssets();
    const { result } = renderCatalog();
    expect(mockUseChunkedAssetsData).toHaveBeenCalledWith({
      currencyIds: ["ethereum", usdc.token.id],
      product: "llm",
      version: "1.0.0",
      skip: false,
    });
    expect(result.current.catalog).toEqual({ status: "loading" });
    expect(result.current.positions.map(position => position.id)).toEqual([eth.id, usdc.id]);
    expect(result.current.refreshCatalog).toBe(refetch);
  });

  it("should build the catalog with the account names once the metadata is loaded", () => {
    mockAssets({ data: mockUsdcAssetsData, isSuccess: true });
    const { result } = renderCatalog();
    if (result.current.catalog.status !== "ready") throw new Error("Expected a ready catalog");
    expect(result.current.catalog.data.accounts.map(account => account.name)).toEqual(["Savings"]);
    expect(result.current.catalog.data.positions).toHaveLength(2);
  });

  it("should report a metadata failure", () => {
    mockAssets({ isError: true });
    expect(renderCatalog().result.current.catalog).toEqual({ status: "error" });
  });

  it("should skip the request and offer no refresh without an eligible position", () => {
    mockAssets();
    const { result } = renderCatalog([]);
    expect(mockUseChunkedAssetsData).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
    expect(result.current.catalog).toEqual({
      status: "ready",
      data: { assets: [], accounts: [], positions: [] },
    });
    expect(result.current.refreshCatalog).toBeUndefined();
  });
});
