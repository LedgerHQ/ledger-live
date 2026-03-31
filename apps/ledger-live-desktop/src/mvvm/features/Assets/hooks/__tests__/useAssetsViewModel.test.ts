import { renderHook, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import { useAssetsViewModel } from "../useAssetsViewModel";
import { padItems, resolveMarketId } from "../../utils/assetTableHelpers";
import {
  createMockCategorizedAssets,
  BITCOIN_ASSET,
  STABLECOIN_ASSET,
} from "@ledgerhq/asset-aggregation/mocks/categorizedAssets.mock";
import type { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  ASSETS_PAGE_CATEGORY_CRYPTOS,
  ASSETS_PAGE_CATEGORY_STABLECOINS,
  EMPTY_STATE_CRYPTOS,
  EMPTY_STATE_STABLECOINS,
  MAX_ITEM_DISPLAYED,
} from "../../constants";
import { buildAssetsPagePath } from "../../utils/buildAssetsPagePath";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import type { AssetTableItem } from "../../types";
import type { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import useCryptoAssetsViewModel from "LLD/features/CryptoAddresses/hooks/useCryptoAssetsViewModel";
import { buildPlaceholderAssetItemsFromAssetsData } from "../../utils/buildPlaceholderAssetItemsFromAssetsData";

const mockNavigate = jest.fn();
const mockSetTrackingSource = jest.fn();
const mockSearchParamsRef = { current: new URLSearchParams() };

jest.mock("~/renderer/analytics/TrackPage", () => ({
  setTrackingSource: (...args: unknown[]) => mockSetTrackingSource(...args),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
  useSearchParams: jest.fn(() => [mockSearchParamsRef.current, jest.fn()]),
}));
const mockedUseNavigate = jest.mocked(useNavigate);

const mockCategorizedAssets = createMockCategorizedAssets();

const mockUseCategorizedAssetsFromPortfolio = jest.fn();

jest.mock("LLD/hooks/useCategorizedAssets", () => ({
  useCategorizedAssetsFromPortfolio: (...args: unknown[]) =>
    mockUseCategorizedAssetsFromPortfolio(...args),
}));

const mockUseAssetsData = jest.fn();
jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData", () => ({
  useAssetsData: (...args: unknown[]) => mockUseAssetsData(...args),
}));

const onboardedStateWithAccounts = {
  settings: AFTER_ONBOARDING_STATE,
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

const solana = getCryptoCurrencyById("solana");
const cardano = getCryptoCurrencyById("cardano");
const polkadot = getCryptoCurrencyById("polkadot");
const ripple = getCryptoCurrencyById("ripple");
const tron = getCryptoCurrencyById("tron");

function buildMockAssetsData(
  cryptos: { id: string; ticker: string; currencyObj: CryptoOrTokenCurrency }[],
): AssetsDataWithPagination {
  const cryptoAssets: AssetsDataWithPagination["cryptoAssets"] = {};
  const cryptoOrTokenCurrencies: AssetsDataWithPagination["cryptoOrTokenCurrencies"] = {};
  const markets: AssetsDataWithPagination["markets"] = {};
  const metaCurrencyIds: string[] = [];

  for (const c of cryptos) {
    metaCurrencyIds.push(c.id);
    cryptoAssets[c.id] = {
      id: c.id,
      ticker: c.ticker,
      name: c.currencyObj.name,
      assetsIds: { [c.id]: c.id },
    };
    cryptoOrTokenCurrencies[c.id] = c.currencyObj;
    markets[c.id] = { id: c.id, price: 100 };
  }

  return {
    cryptoAssets,
    networks: {},
    cryptoOrTokenCurrencies,
    interestRates: {},
    markets,
    currenciesOrder: { metaCurrencyIds, key: "market_cap", order: "desc" },
    pagination: {},
  };
}

function item(id: string, placeholder = false): AssetTableItem {
  return {
    ...BITCOIN_ASSET,
    currency: { ...BITCOIN_ASSET.currency, id },
    isPlaceholder: placeholder,
  };
}

describe("padItems", () => {
  it("should return realItems when count already meets target", () => {
    const real = [item("a"), item("b"), item("c")];
    expect(padItems(real, [item("d", true)], 3)).toBe(real);
  });

  it("should return realItems when count exceeds target", () => {
    const real = [item("a"), item("b"), item("c"), item("d")];
    expect(padItems(real, [item("e", true)], 3)).toBe(real);
  });

  it("should pad with defaults up to targetCount", () => {
    const real = [item("a")];
    const defaults = [item("b", true), item("c", true), item("d", true)];
    const result = padItems(real, defaults, 3);

    expect(result).toHaveLength(3);
    expect(result[0].currency.id).toBe("a");
    expect(result[1].currency.id).toBe("b");
    expect(result[2].currency.id).toBe("c");
  });

  it("should fill entirely from defaults when realItems is empty", () => {
    const defaults = [item("x", true), item("y", true), item("z", true)];
    const result = padItems([], defaults, 3);

    expect(result).toHaveLength(3);
    expect(result.map(i => i.currency.id)).toEqual(["x", "y", "z"]);
  });

  it("should skip defaults whose currency.id already exists in realItems", () => {
    const real = [item("a")];
    const defaults = [item("a", true), item("b", true), item("c", true)];
    const result = padItems(real, defaults, 3);

    expect(result).toHaveLength(3);
    expect(result.map(i => i.currency.id)).toEqual(["a", "b", "c"]);
  });

  it("should return fewer items when defaults are exhausted before targetCount", () => {
    const real = [item("a")];
    const defaults = [item("b", true)];
    const result = padItems(real, defaults, 5);

    expect(result).toHaveLength(2);
    expect(result.map(i => i.currency.id)).toEqual(["a", "b"]);
  });

  it("should return empty array when both inputs are empty", () => {
    expect(padItems([], [], 3)).toEqual([]);
  });
});

describe("resolveMarketId", () => {
  it("should return the last segment of a URN", () => {
    expect(resolveMarketId("urn:crypto:meta-currency:ethereum")).toBe("ethereum");
  });

  it("should return the id as-is when it has no colons", () => {
    expect(resolveMarketId("bitcoin")).toBe("bitcoin");
  });

  it("should replace underscores with hyphens in URN last segment", () => {
    expect(resolveMarketId("urn:crypto:meta-currency:usd_coin")).toBe("usd-coin");
  });

  it("should not replace underscores in plain ids", () => {
    expect(resolveMarketId("usd_coin")).toBe("usd_coin");
  });
});

describe("buildPlaceholderAssetItemsFromAssetsData", () => {
  it("classifies tickers present in stablecoinTickers as stablecoin placeholders", () => {
    const data = buildMockAssetsData([
      { id: STABLECOIN_ASSET.currency.id, ticker: "USDC", currencyObj: STABLECOIN_ASSET.currency },
    ]);
    const { cryptos, stablecoins } = buildPlaceholderAssetItemsFromAssetsData(
      data,
      new Set(["USDC"]),
    );

    expect(cryptos).toHaveLength(0);
    expect(stablecoins).toHaveLength(1);
    expect(stablecoins[0].currency.id).toBe(STABLECOIN_ASSET.currency.id);
    expect(stablecoins[0].isPlaceholder).toBe(true);
    expect(stablecoins[0].placeholderPrice).toBe(100);
  });

  it("classifies tickers not in stablecoinTickers as crypto placeholders", () => {
    const data = buildMockAssetsData([
      { id: BITCOIN_ASSET.currency.id, ticker: "BTC", currencyObj: BITCOIN_ASSET.currency },
    ]);
    const { cryptos, stablecoins } = buildPlaceholderAssetItemsFromAssetsData(data, new Set());

    expect(stablecoins).toHaveLength(0);
    expect(cryptos).toHaveLength(1);
    expect(cryptos[0].currency.id).toBe(BITCOIN_ASSET.currency.id);
  });
});

describe("useAssetsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
      categorizedAssets: mockCategorizedAssets,
      isLoadingStablecoinTickers: false,
      stablecoinTickers: new Set<string>(),
    });
    mockUseAssetsData.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("should return loading state when stablecoin tickers are loading", () => {
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
      categorizedAssets: mockCategorizedAssets,
      isLoadingStablecoinTickers: true,
      stablecoinTickers: new Set<string>(),
    });

    const { result } = renderHook(() => useAssetsViewModel());

    expect(result.current.isLoading).toBe(true);
  });

  it("should return two sections with correct data when loaded", () => {
    const { result } = renderHook(() => useAssetsViewModel(), {
      initialState: onboardedStateWithAccounts,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.sections).toHaveLength(2);

    const [cryptos, stablecoins] = result.current.sections;
    expect(cryptos.sectionId).toBe("cryptos");
    expect(cryptos.totalCount).toBe(mockCategorizedAssets.cryptos.length);

    expect(stablecoins.sectionId).toBe("stablecoins");
    expect(stablecoins.totalCount).toBe(mockCategorizedAssets.stablecoins.length);
  });

  it("should navigate to /assets with cryptos category when cryptos onNavigate is called", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    act(() => {
      result.current.sections[0].onNavigate();
    });

    expect(mockNavigate).toHaveBeenCalledWith(buildAssetsPagePath(ASSETS_PAGE_CATEGORY_CRYPTOS));
  });

  it("should navigate to /assets with stablecoins category when stablecoins onNavigate is called", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    act(() => {
      result.current.sections[1].onNavigate();
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      buildAssetsPagePath(ASSETS_PAGE_CATEGORY_STABLECOINS),
    );
  });

  it("should navigate to /asset when onItemClick is called with a real item", () => {
    const { result } = renderHook(() => useAssetsViewModel());
    const realItem: AssetTableItem = { ...BITCOIN_ASSET, isPlaceholder: false };

    act(() => {
      result.current.sections[0].onItemClick(realItem);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/asset/bitcoin");
  });

  it("should navigate to /market using marketId when onItemClick is called with a placeholder item", () => {
    const { result } = renderHook(() => useAssetsViewModel());
    const placeholderItem: AssetTableItem = {
      ...BITCOIN_ASSET,
      isPlaceholder: true,
      placeholderPrice: 43000,
      marketId: "bitcoin",
    };

    act(() => {
      result.current.sections[0].onItemClick(placeholderItem);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/market/bitcoin");
  });

  it("should resolve URN marketId to its last segment when navigating to /market", () => {
    const { result } = renderHook(() => useAssetsViewModel());
    const placeholderItem: AssetTableItem = {
      ...BITCOIN_ASSET,
      isPlaceholder: true,
      placeholderPrice: 2500,
      marketId: "urn:crypto:meta-currency:ethereum",
    };

    act(() => {
      result.current.sections[0].onItemClick(placeholderItem);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/market/ethereum");
  });

  it("should resolve URN marketId with underscores to hyphenated market slug", () => {
    const { result } = renderHook(() => useAssetsViewModel());
    const placeholderItem: AssetTableItem = {
      ...BITCOIN_ASSET,
      isPlaceholder: true,
      placeholderPrice: 1,
      marketId: "urn:crypto:meta-currency:usd_coin",
    };

    act(() => {
      result.current.sections[0].onItemClick(placeholderItem);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/market/usd-coin");
  });

  it("should use encodeURIComponent on currency.id when marketId is missing on a placeholder", () => {
    const { result } = renderHook(() => useAssetsViewModel());
    const placeholderItem: AssetTableItem = {
      ...BITCOIN_ASSET,
      currency: { ...BITCOIN_ASSET.currency, id: "ethereum/erc20/usd_tether__erc20_" },
      isPlaceholder: true,
    };

    act(() => {
      result.current.sections[0].onItemClick(placeholderItem);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      `/market/${encodeURIComponent("ethereum/erc20/usd_tether__erc20_")}`,
    );
  });

  it("should navigate to /market with marketId for token placeholder items instead of currency.id", () => {
    const { result } = renderHook(() => useAssetsViewModel());
    const placeholderItem: AssetTableItem = {
      ...BITCOIN_ASSET,
      currency: { ...BITCOIN_ASSET.currency, id: "ethereum/erc20/usd_tether__erc20_" },
      isPlaceholder: true,
      marketId: "tether",
    };

    act(() => {
      result.current.sections[0].onItemClick(placeholderItem);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/market/tether");
  });

  it("should have pre-resolved titles in sections", () => {
    const { result } = renderHook(() => useAssetsViewModel());

    expect(result.current.sections[0].title).toBe("Crypto");
    expect(result.current.sections[1].title).toBe("Stablecoins");
  });

  describe("slicing with many items", () => {
    const manyCryptos = makeItems(10);
    const manyStablecoins = makeStablecoinItems(10);

    beforeEach(() => {
      mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
        categorizedAssets: createMockCategorizedAssets({
          cryptos: manyCryptos,
          stablecoins: manyStablecoins,
        }),
        isLoadingStablecoinTickers: false,
        stablecoinTickers: new Set<string>(),
      });
    });

    it("should show empty items when user has no onboarded device and no resolved defaults", () => {
      const { result } = renderHook(() => useAssetsViewModel());

      expect(result.current.sections[0].items).toHaveLength(0);
      expect(result.current.sections[1].items).toHaveLength(0);
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

  describe("padding with placeholder items", () => {
    const mockAssetsData = buildMockAssetsData([
      { id: "solana", ticker: "SOL", currencyObj: solana },
      { id: "cardano", ticker: "ADA", currencyObj: cardano },
      { id: "polkadot", ticker: "DOT", currencyObj: polkadot },
      { id: "ripple", ticker: "XRP", currencyObj: ripple },
      { id: "tron", ticker: "TRX", currencyObj: tron },
    ]);

    beforeEach(() => {
      mockUseAssetsData.mockReturnValue({ data: mockAssetsData, isLoading: false });
    });

    it("should pad cryptos with placeholder items in empty state", () => {
      mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
        categorizedAssets: createMockCategorizedAssets({ cryptos: [], stablecoins: [] }),
        isLoadingStablecoinTickers: false,
        stablecoinTickers: new Set<string>(),
      });

      const { result } = renderHook(() => useAssetsViewModel());
      const cryptoSection = result.current.sections[0];

      expect(cryptoSection.items).toHaveLength(EMPTY_STATE_CRYPTOS);
      expect(cryptoSection.items.every(item => item.isPlaceholder)).toBe(true);
      expect(cryptoSection.totalCount).toBe(EMPTY_STATE_CRYPTOS);
    });

    it("should not include already-owned currencies in padding", () => {
      mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
        categorizedAssets: createMockCategorizedAssets({
          cryptos: [{ ...BITCOIN_ASSET, currency: solana }],
          stablecoins: [],
        }),
        isLoadingStablecoinTickers: false,
        stablecoinTickers: new Set<string>(),
      });

      const { result } = renderHook(() => useAssetsViewModel(), {
        initialState: onboardedStateWithAccounts,
      });
      const cryptoSection = result.current.sections[0];

      expect(cryptoSection.items).toHaveLength(EMPTY_STATE_CRYPTOS);
      const placeholderIds = cryptoSection.items
        .filter(item => item.isPlaceholder)
        .map(item => item.currency.id);
      expect(placeholderIds).not.toContain("solana");
    });

    it("should not pad when real items exceed target count", () => {
      const manyCryptos = makeItems(MAX_ITEM_DISPLAYED);
      mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
        categorizedAssets: createMockCategorizedAssets({
          cryptos: manyCryptos,
          stablecoins: makeStablecoinItems(EMPTY_STATE_STABLECOINS),
        }),
        isLoadingStablecoinTickers: false,
        stablecoinTickers: new Set<string>(),
      });

      const { result } = renderHook(() => useAssetsViewModel(), {
        initialState: onboardedStateWithAccounts,
      });
      const cryptoSection = result.current.sections[0];

      expect(cryptoSection.items.every(item => !item.isPlaceholder)).toBe(true);
    });

    it("should include marketId from market data on placeholder items", () => {
      mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
        categorizedAssets: createMockCategorizedAssets({ cryptos: [], stablecoins: [] }),
        isLoadingStablecoinTickers: false,
        stablecoinTickers: new Set<string>(),
      });

      const { result } = renderHook(() => useAssetsViewModel());
      const cryptoSection = result.current.sections[0];

      expect(cryptoSection.items.every(item => typeof item.marketId === "string")).toBe(true);
      expect(cryptoSection.items[0].marketId).toBe("solana");
    });

    it("should include placeholderPrice from market data", () => {
      mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
        categorizedAssets: createMockCategorizedAssets({ cryptos: [], stablecoins: [] }),
        isLoadingStablecoinTickers: false,
        stablecoinTickers: new Set<string>(),
      });

      const { result } = renderHook(() => useAssetsViewModel());
      const cryptoSection = result.current.sections[0];

      expect(cryptoSection.items.every(item => item.placeholderPrice === 100)).toBe(true);
    });

    it("should be loading when assets data is loading and padding is needed", () => {
      mockUseAssetsData.mockReturnValue({ data: undefined, isLoading: true });

      const { result } = renderHook(() => useAssetsViewModel());

      expect(result.current.isLoading).toBe(true);
    });
  });
});

describe("useCryptoAssetsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetTrackingSource.mockClear();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockSearchParamsRef.current = new URLSearchParams();
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
      categorizedAssets: mockCategorizedAssets,
      isLoadingStablecoinTickers: false,
      stablecoinTickers: new Set(["USDC"]),
    });
    mockUseAssetsData.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("returns stablecoins title by default (no category query)", () => {
    const { result } = renderHook(() => useCryptoAssetsViewModel());
    expect(result.current.title).toBe("Stablecoins");
  });

  it("returns cryptos title when category=cryptos", () => {
    mockSearchParamsRef.current.set("category", "cryptos");
    const { result } = renderHook(() => useCryptoAssetsViewModel());
    expect(result.current.title).toBe("Crypto");
  });

  it("lists owned cryptos when category=cryptos and user has accounts", () => {
    mockSearchParamsRef.current.set("category", "cryptos");
    const { result } = renderHook(() => useCryptoAssetsViewModel(), {
      initialState: onboardedStateWithAccounts,
    });
    expect(
      result.current.items.some(
        item => item.currency.id === BITCOIN_ASSET.currency.id && !item.isPlaceholder,
      ),
    ).toBe(true);
  });

  it("navigates home when onBack is called", () => {
    const { result } = renderHook(() => useCryptoAssetsViewModel());

    act(() => {
      result.current.onBack();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("lists owned stablecoins when the user has accounts", () => {
    const { result } = renderHook(() => useCryptoAssetsViewModel(), {
      initialState: onboardedStateWithAccounts,
    });

    expect(
      result.current.items.some(
        item => item.currency.id === STABLECOIN_ASSET.currency.id && !item.isPlaceholder,
      ),
    ).toBe(true);
  });

  it("navigates to the asset page and sets tracking when a real row is activated", () => {
    const { result } = renderHook(() => useCryptoAssetsViewModel(), {
      initialState: onboardedStateWithAccounts,
    });
    const real = result.current.items.find(item => !item.isPlaceholder);
    expect(real).toBeDefined();

    act(() => {
      result.current.onAssetRowClick(real!);
    });

    expect(mockSetTrackingSource).toHaveBeenCalledWith("Assets");
    expect(mockNavigate).toHaveBeenCalledWith(`/asset/${real!.currency.id}`);
  });

  it("navigates to the market page when a placeholder row is activated", () => {
    const usdc = STABLECOIN_ASSET.currency;
    mockUseAssetsData.mockReturnValue({
      data: buildMockAssetsData([{ id: usdc.id, ticker: "USDC", currencyObj: usdc }]),
      isLoading: false,
    });
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
      categorizedAssets: createMockCategorizedAssets({ cryptos: [], stablecoins: [] }),
      isLoadingStablecoinTickers: false,
      stablecoinTickers: new Set(["USDC"]),
    });

    const { result } = renderHook(() => useCryptoAssetsViewModel(), {
      initialState: onboardedStateWithAccounts,
    });

    const placeholder = result.current.items.find(item => item.isPlaceholder);
    expect(placeholder).toBeDefined();

    act(() => {
      result.current.onAssetRowClick(placeholder!);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      `/market/${encodeURIComponent(resolveMarketId(placeholder!.marketId ?? placeholder!.currency.id))}`,
    );
  });

  it("is loading while stablecoin tickers are loading", () => {
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
      categorizedAssets: mockCategorizedAssets,
      isLoadingStablecoinTickers: true,
      stablecoinTickers: new Set(["USDC"]),
    });

    const { result } = renderHook(() => useCryptoAssetsViewModel());

    expect(result.current.isLoading).toBe(true);
  });
});
