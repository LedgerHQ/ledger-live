import { loadBlacklistedTokenSections } from "./helpers";
import { getCryptoAssetsStore } from "../bridge/crypto-assets/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("../bridge/crypto-assets/index");

const mockGetCryptoAssetsStore = getCryptoAssetsStore as jest.MockedFunction<
  typeof getCryptoAssetsStore
>;

const mockEthereumCurrency: CryptoCurrency = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  type: "CryptoCurrency",
  managerAppName: "Ethereum",
  coinType: 60,
  scheme: "ethereum",
  color: "#0ebdcd",
  family: "ethereum",
  explorerViews: [],
  units: [
    {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
  ],
};

const mockPolygonCurrency: CryptoCurrency = {
  id: "polygon",
  name: "Polygon",
  ticker: "MATIC",
  type: "CryptoCurrency",
  managerAppName: "Polygon",
  coinType: 60,
  scheme: "polygon",
  color: "#8247e5",
  family: "evm",
  explorerViews: [],
  units: [
    {
      name: "matic",
      code: "MATIC",
      magnitude: 18,
    },
  ],
};

const mockUsdtToken: TokenCurrency = {
  id: "ethereum/erc20/usdt",
  type: "TokenCurrency",
  name: "Tether USD",
  ticker: "USDT",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  parentCurrency: mockEthereumCurrency,
  tokenType: "erc20",
  units: [
    {
      name: "USDT",
      code: "USDT",
      magnitude: 6,
    },
  ],
};

const mockUsdcToken: TokenCurrency = {
  id: "ethereum/erc20/usdc",
  type: "TokenCurrency",
  name: "USD Coin",
  ticker: "USDC",
  contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  parentCurrency: mockEthereumCurrency,
  tokenType: "erc20",
  units: [
    {
      name: "USDC",
      code: "USDC",
      magnitude: 6,
    },
  ],
};

const mockMaticUsdtToken: TokenCurrency = {
  id: "polygon/erc20/usdt",
  type: "TokenCurrency",
  name: "Tether USD (Polygon)",
  ticker: "USDT",
  contractAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  parentCurrency: mockPolygonCurrency,
  tokenType: "erc20",
  units: [
    {
      name: "USDT",
      code: "USDT",
      magnitude: 6,
    },
  ],
};

describe("loadBlacklistedTokenSections", () => {
  let mockFindTokenById: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindTokenById = jest.fn();
    mockGetCryptoAssetsStore.mockReturnValue({
      findTokenById: mockFindTokenById,
    } as any);
  });

  it("should return empty array for empty token list", async () => {
    const result = await loadBlacklistedTokenSections([]);
    expect(result).toEqual([]);
  });

  it("should create one section for a single token", async () => {
    mockFindTokenById.mockResolvedValueOnce(mockUsdtToken);

    const result = await loadBlacklistedTokenSections(["ethereum/erc20/usdt"]);

    expect(result).toHaveLength(1);
    expect(result[0].parentCurrency).toBe(mockEthereumCurrency);
    expect(result[0].tokens).toEqual([mockUsdtToken]);
  });

  it("should group multiple tokens from the same parent currency", async () => {
    mockFindTokenById.mockResolvedValueOnce(mockUsdtToken);
    mockFindTokenById.mockResolvedValueOnce(mockUsdcToken);

    const result = await loadBlacklistedTokenSections([
      "ethereum/erc20/usdt",
      "ethereum/erc20/usdc",
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].parentCurrency).toBe(mockEthereumCurrency);
    expect(result[0].tokens).toHaveLength(2);
    expect(result[0].tokens).toEqual([mockUsdtToken, mockUsdcToken]);
  });

  it("should create separate sections for different parent currencies", async () => {
    mockFindTokenById.mockResolvedValueOnce(mockUsdtToken);
    mockFindTokenById.mockResolvedValueOnce(mockMaticUsdtToken);

    const result = await loadBlacklistedTokenSections([
      "ethereum/erc20/usdt",
      "polygon/erc20/usdt",
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].parentCurrency).toBe(mockEthereumCurrency);
    expect(result[0].tokens).toEqual([mockUsdtToken]);
    expect(result[1].parentCurrency).toBe(mockPolygonCurrency);
    expect(result[1].tokens).toEqual([mockMaticUsdtToken]);
  });

  it("should filter out null/undefined tokens", async () => {
    mockFindTokenById.mockResolvedValueOnce(mockUsdtToken);
    mockFindTokenById.mockResolvedValueOnce(null);
    mockFindTokenById.mockResolvedValueOnce(mockUsdcToken);

    const result = await loadBlacklistedTokenSections([
      "ethereum/erc20/usdt",
      "invalid/token/id",
      "ethereum/erc20/usdc",
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].parentCurrency).toBe(mockEthereumCurrency);
    expect(result[0].tokens).toHaveLength(2);
    expect(result[0].tokens).toEqual([mockUsdtToken, mockUsdcToken]);
  });

  it("should handle complex scenario with mixed parent currencies and null tokens", async () => {
    mockFindTokenById.mockResolvedValueOnce(mockUsdtToken);
    mockFindTokenById.mockResolvedValueOnce(mockMaticUsdtToken);
    mockFindTokenById.mockResolvedValueOnce(null);
    mockFindTokenById.mockResolvedValueOnce(mockUsdcToken);

    const result = await loadBlacklistedTokenSections([
      "ethereum/erc20/usdt",
      "polygon/erc20/usdt",
      "invalid/token",
      "ethereum/erc20/usdc",
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].parentCurrency).toBe(mockEthereumCurrency);
    expect(result[0].tokens).toHaveLength(2);
    expect(result[0].tokens).toEqual([mockUsdtToken, mockUsdcToken]);
    expect(result[1].parentCurrency).toBe(mockPolygonCurrency);
    expect(result[1].tokens).toHaveLength(1);
    expect(result[1].tokens).toEqual([mockMaticUsdtToken]);
  });

  it("should call findTokenById for all token IDs in parallel", async () => {
    mockFindTokenById.mockResolvedValue(mockUsdtToken);

    await loadBlacklistedTokenSections(["token1", "token2", "token3"]);

    // All calls should be made immediately (Promise.all)
    expect(mockFindTokenById).toHaveBeenCalledTimes(3);
    expect(mockFindTokenById).toHaveBeenCalledWith("token1");
    expect(mockFindTokenById).toHaveBeenCalledWith("token2");
    expect(mockFindTokenById).toHaveBeenCalledWith("token3");
  });
});
