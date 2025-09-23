import { withLegacyFallback } from "../withLegacyFallback";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";

// Mock log function
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

// Mock legacy state
jest.mock("@ledgerhq/cryptoassets/legacy-state", () => ({
  tokensById: {},
  tokensByTicker: {},
  tokensByAddress: {},
  tokensByCurrencyAddress: {},
}));

// Mock legacy functions
jest.mock("@ledgerhq/cryptoassets/legacy", () => ({
  initializeLegacyTokens: jest.fn(),
  addTokens: jest.fn(),
}));

// Import mocked legacy state
const mockLegacyState = jest.requireMock("@ledgerhq/cryptoassets/legacy-state");

// Mock new store
const mockNewStore: CryptoAssetsStore = {
  findTokenByAddress: jest.fn(),
  getTokenById: jest.fn(),
  findTokenById: jest.fn(),
  findTokenByAddressInCurrency: jest.fn(),
  findTokenByTicker: jest.fn(),
};

const mockToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usdt",
  name: "Tether USD",
  ticker: "USDT",
  contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentCurrency: {} as any,
  tokenType: "erc20",
  units: [],
};

describe("withLegacyFallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear mock legacy state
    Object.keys(mockLegacyState.tokensById).forEach(key => delete mockLegacyState.tokensById[key]);
    Object.keys(mockLegacyState.tokensByTicker).forEach(
      key => delete mockLegacyState.tokensByTicker[key],
    );
    Object.keys(mockLegacyState.tokensByAddress).forEach(
      key => delete mockLegacyState.tokensByAddress[key],
    );
    Object.keys(mockLegacyState.tokensByCurrencyAddress).forEach(
      key => delete mockLegacyState.tokensByCurrencyAddress[key],
    );
  });

  it("should use legacy store when token is found by id", async () => {
    // Setup legacy state
    mockLegacyState.tokensById["ethereum/erc20/usdt"] = mockToken;

    const wrappedStore = withLegacyFallback(mockNewStore);
    const result = await wrappedStore.findTokenById("ethereum/erc20/usdt");

    expect(result).toEqual(mockToken);
    expect(mockNewStore.findTokenById).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      "crypto-assets-cache",
      "Legacy fallback hit for id:ethereum/erc20/usdt",
    );
  });

  it("should fallback to new store when legacy token not found", async () => {
    // Legacy state is empty
    (mockNewStore.findTokenById as jest.Mock).mockResolvedValue(mockToken);

    const wrappedStore = withLegacyFallback(mockNewStore);
    const result = await wrappedStore.findTokenById("ethereum/erc20/usdt");

    expect(result).toEqual(mockToken);
    expect(mockNewStore.findTokenById).toHaveBeenCalledWith("ethereum/erc20/usdt");
  });

  it("should use legacy store when token found by address", async () => {
    // Setup legacy state
    mockLegacyState.tokensByAddress["0xdac17f958d2ee523a2206206994597c13d831ec7"] = mockToken;

    const wrappedStore = withLegacyFallback(mockNewStore);
    const result = await wrappedStore.findTokenByAddress(
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    );

    expect(result).toEqual(mockToken);
    expect(mockNewStore.findTokenByAddress).not.toHaveBeenCalled();
  });

  it("should handle getTokenById with legacy fallback", async () => {
    // Setup legacy state
    mockLegacyState.tokensById["ethereum/erc20/usdt"] = mockToken;

    const wrappedStore = withLegacyFallback(mockNewStore);
    const result = await wrappedStore.getTokenById("ethereum/erc20/usdt");

    expect(result).toEqual(mockToken);
    expect(mockNewStore.getTokenById).not.toHaveBeenCalled();
  });

  it("should fallback to new store for getTokenById when legacy fails", async () => {
    // Legacy state is empty
    (mockNewStore.getTokenById as jest.Mock).mockResolvedValue(mockToken);

    const wrappedStore = withLegacyFallback(mockNewStore);
    const result = await wrappedStore.getTokenById("ethereum/erc20/usdt");

    expect(result).toEqual(mockToken);
    expect(mockNewStore.getTokenById).toHaveBeenCalledWith("ethereum/erc20/usdt");
  });
});
