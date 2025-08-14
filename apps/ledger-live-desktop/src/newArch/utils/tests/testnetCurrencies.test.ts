import { addTestnetCurrencies, getTestnetCurrencies } from "../testnetCurrencies";
import { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { listSupportedCurrencies } from "@ledgerhq/coin-framework/currencies/index";

jest.mock("@ledgerhq/coin-framework/currencies/index", () => ({
  listSupportedCurrencies: jest.fn(),
}));

const mockListSupportedCurrencies = listSupportedCurrencies as jest.MockedFunction<
  typeof listSupportedCurrencies
>;

describe("testnetCurrencies", () => {
  const mockMainnetCurrency: CryptoCurrency = {
    type: "CryptoCurrency",
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    managerAppName: "Ethereum",
    coinType: 60,
    scheme: "ethereum",
    color: "#627eea",
    family: "ethereum",
    blockAvgTime: 12,
    units: [
      {
        name: "ethereum",
        code: "ETH",
        magnitude: 18,
      },
    ],
    explorerViews: [],
  };

  const mockTestnetCurrency: CryptoCurrency = {
    type: "CryptoCurrency",
    id: "ethereum_sepolia",
    name: "Ethereum Sepolia",
    managerAppName: "Ethereum",
    coinType: 60,
    ticker: "ETH",
    scheme: "ethereum_sepolia",
    color: "#627eea",
    family: "ethereum",
    blockAvgTime: 12,
    units: [
      {
        name: "ethereum_sepolia",
        code: "ETH",
        magnitude: 18,
      },
    ],
    explorerViews: [],
    isTestnetFor: "ethereum",
  };

  const mockBitcoinTestnetCurrency: CryptoCurrency = {
    type: "CryptoCurrency",
    id: "bitcoin_testnet",
    name: "Bitcoin Testnet",
    ticker: "BTC",
    managerAppName: "Bitcoin",
    coinType: 1,
    scheme: "bitcoin_testnet",
    color: "#ffae35",
    family: "bitcoin",
    blockAvgTime: 600,
    units: [
      {
        name: "bitcoin_testnet",
        code: "BTC",
        magnitude: 8,
      },
    ],
    explorerViews: [],
    isTestnetFor: "bitcoin",
  };

  const mockToken: CryptoOrTokenCurrency = {
    type: "TokenCurrency",
    id: "ethereum/erc20/usdc",
    name: "USD Coin",
    ticker: "USDC",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    parentCurrency: mockMainnetCurrency,
    tokenType: "erc20",
    units: [
      {
        name: "USD Coin",
        code: "USDC",
        magnitude: 6,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTestnetCurrencies", () => {
    it("should filter and return only testnet currencies from provided currencies", () => {
      const inputCurrencies = [
        mockMainnetCurrency,
        mockTestnetCurrency,
        mockBitcoinTestnetCurrency,
        mockToken,
      ];

      const result = getTestnetCurrencies(inputCurrencies);

      expect(result).toEqual([mockTestnetCurrency, mockBitcoinTestnetCurrency]);
      expect(result).toHaveLength(2);
      expect(result.every(currency => currency.type === "CryptoCurrency")).toBe(true);
      expect(result.every(currency => (currency as CryptoCurrency).isTestnetFor)).toBe(true);
    });

    it("should return empty array when no testnet currencies are provided", () => {
      const inputCurrencies = [mockMainnetCurrency, mockToken];

      const result = getTestnetCurrencies(inputCurrencies);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should use listSupportedCurrencies when no currencies parameter is provided", () => {
      const allCurrencies = [
        mockMainnetCurrency,
        mockTestnetCurrency,
        mockBitcoinTestnetCurrency,
        mockToken,
      ];
      mockListSupportedCurrencies.mockReturnValue(allCurrencies as CryptoCurrency[]);

      const result = getTestnetCurrencies();

      expect(mockListSupportedCurrencies).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockTestnetCurrency, mockBitcoinTestnetCurrency]);
    });

    it("should exclude TokenCurrency types even if they have isTestnetFor", () => {
      const testnetToken = {
        ...mockToken,
        isTestnetFor: "ethereum",
      };
      const inputCurrencies = [mockMainnetCurrency, mockTestnetCurrency, testnetToken];

      const result = getTestnetCurrencies(inputCurrencies);

      expect(result).toEqual([mockTestnetCurrency]);
      expect(result).toHaveLength(1);
    });
  });

  describe("addTestnetCurrencies", () => {
    beforeEach(() => {
      mockListSupportedCurrencies.mockReturnValue([
        mockTestnetCurrency,
        mockBitcoinTestnetCurrency,
      ]);
    });

    it("should add testnet currencies to provided currencies and remove duplicates", () => {
      const inputCurrencies = [mockMainnetCurrency];

      const result = addTestnetCurrencies(inputCurrencies);

      expect(result).toHaveLength(3);
      expect(result).toContain(mockMainnetCurrency);
      expect(result).toContain(mockTestnetCurrency);
      expect(result).toContain(mockBitcoinTestnetCurrency);
    });

    it("should remove duplicates when same currency exists in both input and testnet currencies", () => {
      const inputCurrencies = [mockMainnetCurrency, mockTestnetCurrency];

      const result = addTestnetCurrencies(inputCurrencies);

      expect(result).toHaveLength(3);
      expect(result.filter(currency => currency.id === mockTestnetCurrency.id)).toHaveLength(1);
    });

    it("should return only testnet currencies when no input currencies provided", () => {
      const result = addTestnetCurrencies();

      expect(result).toEqual([mockTestnetCurrency, mockBitcoinTestnetCurrency]);
      expect(result).toHaveLength(2);
    });

    it("should return only testnet currencies when empty array is provided", () => {
      const result = addTestnetCurrencies([]);

      expect(result).toEqual([mockTestnetCurrency, mockBitcoinTestnetCurrency]);
      expect(result).toHaveLength(2);
    });

    it("should preserve original currencies order and append testnet currencies", () => {
      const inputCurrencies = [mockMainnetCurrency, mockToken];

      const result = addTestnetCurrencies(inputCurrencies);

      expect(result[0]).toBe(mockMainnetCurrency);
      expect(result[1]).toBe(mockToken);
      expect(result.slice(2)).toEqual([mockTestnetCurrency, mockBitcoinTestnetCurrency]);
    });

    it("should handle large currency lists efficiently", () => {
      const largeCurrencyList = Array.from({ length: 100 }, (_, index) => ({
        ...mockMainnetCurrency,
        id: `currency_${index}`,
        name: `Currency ${index}`,
      }));

      const result = addTestnetCurrencies(largeCurrencyList as CryptoCurrency[]);

      expect(result).toHaveLength(102);
      expect(result.slice(0, 100)).toEqual(largeCurrencyList);
      expect(result.slice(100)).toEqual([mockTestnetCurrency, mockBitcoinTestnetCurrency]);
    });
  });

  describe("integration", () => {
    it("should work correctly when getTestNetCurrencies and addTestNetCurrencies are used together", () => {
      const allCurrencies = [
        mockMainnetCurrency,
        mockTestnetCurrency,
        mockBitcoinTestnetCurrency,
        mockToken,
      ];

      const testnetCurrencies = getTestnetCurrencies(allCurrencies);
      expect(testnetCurrencies).toHaveLength(2);

      const mainnetCurrencies = [mockMainnetCurrency, mockToken];
      mockListSupportedCurrencies.mockReturnValue(testnetCurrencies as CryptoCurrency[]);

      const result = addTestnetCurrencies(mainnetCurrencies);

      expect(result).toHaveLength(4);
      expect(result).toContain(mockMainnetCurrency);
      expect(result).toContain(mockToken);
      expect(result).toContain(mockTestnetCurrency);
      expect(result).toContain(mockBitcoinTestnetCurrency);
    });
  });
});
