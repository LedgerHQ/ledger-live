import { useAssetsData } from "@features/platform-aggregated-assets";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { expectedAssetsSorted } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";
import { renderHook, waitFor } from "tests/testSetup";
import { useModularDialogData } from "../useModularDialogData";

jest.mock("@features/platform-aggregated-assets", () => {
  const actual = jest.requireActual<typeof import("@features/platform-aggregated-assets")>(
    "@features/platform-aggregated-assets",
  );

  return {
    ...actual,
    useAssetsData: jest.fn(actual.useAssetsData),
  };
});

const mockedUseAssetsData = jest.mocked(useAssetsData);
const actualUseAssetsData = jest.requireActual<
  typeof import("@features/platform-aggregated-assets")
>("@features/platform-aggregated-assets").useAssetsData;

describe("useModularDialogData", () => {
  it("should return the correct data structure", async () => {
    const { result } = renderHook(() => useModularDialogData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.loadingStatus).toBe(LoadingStatus.Pending);

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.loadingStatus).toBe(LoadingStatus.Success);
  });

  it("should process assets data correctly", async () => {
    const { result } = renderHook(() => useModularDialogData());

    expect(result.current.isLoading).toBe(true);

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    const { assetsSorted, sortedCryptoCurrencies } = result.current;

    expect(assetsSorted).toBeDefined();
    expect(assetsSorted).toHaveLength(10);
    const assets = assetsSorted?.map(assetData => assetData.asset);
    expect(assets).toEqual(expectedAssetsSorted);

    expect(sortedCryptoCurrencies).toBeDefined();
    expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
    expect(sortedCryptoCurrencies[0].id).toBe("bitcoin");
  });
});

describe("useModularDialogData filters", () => {
  beforeEach(() => {
    mockedUseAssetsData.mockClear();
    mockedUseAssetsData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetchingNextPage: false,
      isSuccess: true,
      isError: false,
      error: undefined,
      errorInfo: {
        hasError: false,
        isNetworkError: false,
        isApiError: false,
        apiStatus: undefined,
      },
      loadNext: jest.fn(),
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    mockedUseAssetsData.mockImplementation(actualUseAssetsData);
  });

  it("should forward network ids without treating them as exact currency ids", () => {
    renderHook(() => useModularDialogData(), {
      initialState: {
        modularDialog: {
          searchedValue: undefined,
          isDebuggingDuplicates: false,
          flow: "",
          source: "",
          isOpen: true,
          dialogParams: {
            networkIds: ["ethereum"],
            currencies: ["bitcoin"],
            areCurrenciesFiltered: true,
          },
        },
      },
    });

    expect(mockedUseAssetsData).toHaveBeenCalledWith(
      expect.objectContaining({
        currencyIds: undefined,
        networkIds: ["ethereum"],
        areCurrenciesFiltered: false,
      }),
    );
  });

  it("should preserve the existing exact currency filter", () => {
    renderHook(() => useModularDialogData(), {
      initialState: {
        modularDialog: {
          searchedValue: undefined,
          isDebuggingDuplicates: false,
          flow: "",
          source: "",
          isOpen: true,
          dialogParams: {
            currencies: ["bitcoin"],
            areCurrenciesFiltered: true,
          },
        },
      },
    });

    expect(mockedUseAssetsData).toHaveBeenCalledWith(
      expect.objectContaining({
        currencyIds: ["bitcoin"],
        areCurrenciesFiltered: true,
      }),
    );
  });

  it("should forward category filtering to the assets query", () => {
    renderHook(() => useModularDialogData(), {
      initialState: {
        modularDialog: {
          searchedValue: undefined,
          isDebuggingDuplicates: false,
          flow: "",
          source: "",
          isOpen: true,
          dialogParams: {
            categories: [AssetCategory.Stablecoins],
          },
        },
      },
    });

    expect(mockedUseAssetsData).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [AssetCategory.Stablecoins],
      }),
    );
  });

  it("should preserve the exact currency filter when network ids are empty", () => {
    renderHook(() => useModularDialogData(), {
      initialState: {
        modularDialog: {
          searchedValue: undefined,
          isDebuggingDuplicates: false,
          flow: "",
          source: "",
          isOpen: true,
          dialogParams: {
            networkIds: [],
            currencies: ["bitcoin"],
            areCurrenciesFiltered: true,
          },
        },
      },
    });

    expect(mockedUseAssetsData).toHaveBeenCalledWith(
      expect.objectContaining({
        currencyIds: ["bitcoin"],
        networkIds: undefined,
        areCurrenciesFiltered: true,
      }),
    );
  });
});
