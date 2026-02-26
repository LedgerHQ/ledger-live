import { renderHook, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import { useAssetsViewModel } from "../useAssetsViewModel";
import { createMockCategorizedAssets } from "@ledgerhq/asset-aggregation/mocks/categorizedAssets.mock";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

const mockCategorizedAssets = createMockCategorizedAssets();

const mockUseCategorizedAssetsFromPortfolio = jest.fn();

jest.mock("LLD/hooks/useCategorizedAssets", () => ({
  useCategorizedAssetsFromPortfolio: (...args: unknown[]) =>
    mockUseCategorizedAssetsFromPortfolio(...args),
}));

describe("useAssetsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
      categorizedAssets: mockCategorizedAssets,
      isLoadingStablecoinTickers: false,
    });
  });

  it("should return loading state when stablecoin tickers are loading", () => {
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
      categorizedAssets: undefined,
      isLoadingStablecoinTickers: true,
    });

    const { result } = renderHook(() => useAssetsViewModel());

    expect(result.current.isLoading).toBe(true);
  });

  it("should return categorized data when loaded", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockCategorizedAssets);
  });

  it("should navigate to /assets when onNavigate is called", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    act(() => {
      result.current.onNavigate();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/assets");
  });

  it("should return a translation function", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    expect(result.current.t).toBeDefined();
    expect(typeof result.current.t).toBe("function");
  });
});
