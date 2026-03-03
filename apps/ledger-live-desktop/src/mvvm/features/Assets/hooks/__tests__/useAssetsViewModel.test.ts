import { renderHook, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import { DeviceModelId } from "@ledgerhq/devices";
import { useAssetsViewModel } from "../useAssetsViewModel";
import {
  createMockCategorizedAssets,
  BITCOIN_ASSET,
  STABLECOIN_ASSET,
} from "@ledgerhq/asset-aggregation/mocks/categorizedAssets.mock";
import type { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { EMPTY_STATE_CRYPTOS, EMPTY_STATE_STABLECOINS, MAX_ITEM_DISPLAYED } from "../../constants";
import { genAccount } from "@ledgerhq/coin-framework/lib-es/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib-es/index";

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

const MOCK_LAST_SEEN_DEVICE = {
  modelId: DeviceModelId.nanoX,
  deviceInfo: {},
  apps: [],
};

const onboardedStateWithAccounts = {
  settings: { lastSeenDevice: MOCK_LAST_SEEN_DEVICE },
  accounts: [genAccount("acc-1", { currency: getCryptoCurrencyById("bitcoin") })],
};

function makeItems(count: number): CategorizedAssetItem[] {
  return Array.from({ length: count }, (_, i) => ({
    ...BITCOIN_ASSET,
    currency: { ...BITCOIN_ASSET.currency, id: `crypto-${i}` },
  }));
}

function makeStablecoinItems(count: number): CategorizedAssetItem[] {
  return Array.from({ length: count }, (_, i) => ({
    ...STABLECOIN_ASSET,
    currency: { ...STABLECOIN_ASSET.currency, id: `stablecoin-${i}` },
  }));
}

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
      categorizedAssets: mockCategorizedAssets,
      isLoadingStablecoinTickers: true,
    });

    const { result } = renderHook(() => useAssetsViewModel());

    expect(result.current.isLoading).toBe(true);
  });

  it("should return two sections with correct data when loaded", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.sections).toHaveLength(2);

    const [cryptos, stablecoins] = result.current.sections;
    expect(cryptos.sectionId).toBe("cryptos");
    expect(cryptos.totalCount).toBe(mockCategorizedAssets.cryptos.length);

    expect(stablecoins.sectionId).toBe("stablecoins");
    expect(stablecoins.totalCount).toBe(mockCategorizedAssets.stablecoins.length);
  });

  it("should navigate to /assets when onNavigate is called", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    act(() => {
      result.current.sections[0].onNavigate();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/assets");
  });

  it("should navigate to asset page when onItemClick is called", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    act(() => {
      result.current.sections[0].onItemClick(BITCOIN_ASSET);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/asset/bitcoin");
  });

  it("should have pre-resolved titles in sections", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    expect(result.current.sections[0].title).toBe("Cryptos");
    expect(result.current.sections[1].title).toBe("Stablecoins");
  });

  describe("empty state slicing", () => {
    const manyCryptos = makeItems(10);
    const manyStablecoins = makeStablecoinItems(10);

    beforeEach(() => {
      mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
        categorizedAssets: createMockCategorizedAssets({
          cryptos: manyCryptos,
          stablecoins: manyStablecoins,
        }),
        isLoadingStablecoinTickers: false,
      });
    });

    it("should slice items to empty state limits when user has no onboarded device", () => {
      const { result } = renderHook(() => useAssetsViewModel());

      expect(result.current.sections[0].items).toHaveLength(EMPTY_STATE_CRYPTOS);
      expect(result.current.sections[1].items).toHaveLength(EMPTY_STATE_STABLECOINS);
      expect(result.current.sections[0].totalCount).toBe(manyCryptos.length);
      expect(result.current.sections[1].totalCount).toBe(manyStablecoins.length);
    });

    it("should slice items to MAX_ITEM_DISPLAYED when user is onboarded with accounts", () => {
      const { result } = renderHook(() => useAssetsViewModel(), {
        initialState: onboardedStateWithAccounts,
      });

      expect(result.current.sections[0].items).toHaveLength(MAX_ITEM_DISPLAYED);
      expect(result.current.sections[1].items).toHaveLength(MAX_ITEM_DISPLAYED);
      expect(result.current.sections[0].totalCount).toBe(manyCryptos.length);
      expect(result.current.sections[1].totalCount).toBe(manyStablecoins.length);
    });
  });
});
