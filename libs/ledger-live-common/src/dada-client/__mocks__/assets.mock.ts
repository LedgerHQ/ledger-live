const mockInjectiveCurrency = {
  type: "CryptoCurrency" as const,
  id: "injective",
  name: "Injective",
  ticker: "INJ",
  units: [
    {
      name: "INJ",
      code: "INJ",
      magnitude: 18,
    },
  ],
  family: "injective",
  managerAppName: "Injective",
  coinType: 60,
  scheme: "injective",
  color: "#00F2FE",
  explorerViews: [],
};

const mockEthereumCurrency = {
  type: "CryptoCurrency" as const,
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  units: [],
  family: "ethereum",
  managerAppName: "Ethereum",
  coinType: 60,
  scheme: "ethereum",
  color: "#627EEA",
  explorerViews: [],
};

const mockBscCurrency = {
  type: "CryptoCurrency" as const,
  id: "bsc",
  name: "Binance Smart Chain",
  ticker: "BNB",
  units: [],
  family: "evm",
  managerAppName: "Binance Smart Chain",
  coinType: 60,
  scheme: "bsc",
  color: "#F3BA2F",
  explorerViews: [],
};

export const mockAssetsData = {
  cryptoAssets: {
    "urn:crypto:meta-currency:injective_protocol": {
      id: "urn:crypto:meta-currency:injective_protocol",
      ticker: "INJ",
      name: "Injective",
      assetsIds: {
        injective: "injective",
        ethereum: "ethereum/erc20/injective_token",
        bsc: "bsc/bep20/injective_protocol",
      },
    },
  },
  networks: {
    bsc: { id: "bsc", name: "Binance Smart Chain" },
    ethereum: { id: "ethereum", name: "Ethereum" },
    injective: { id: "injective", name: "Injective" },
  },
  cryptoOrTokenCurrencies: {
    "bsc/bep20/injective_protocol": {
      type: "TokenCurrency" as const,
      id: "bsc/bep20/injective_protocol",
      name: "Injective Protocol",
      ticker: "INJ",
      contractAddress: "0x0",
      parentCurrency: mockBscCurrency,
      tokenType: "bep20",
      units: [
        {
          name: "INJ",
          code: "INJ",
          magnitude: 18,
        },
      ],
    },
    "ethereum/erc20/injective_token": {
      type: "TokenCurrency" as const,
      id: "ethereum/erc20/injective_token",
      name: "Injective Token",
      ticker: "INJ",
      contractAddress: "0x0",
      parentCurrency: mockEthereumCurrency,
      tokenType: "erc20",
      units: [
        {
          name: "INJ",
          code: "INJ",
          magnitude: 18,
        },
      ],
    },
    injective: mockInjectiveCurrency,
  },
  interestRates: {},
  markets: {},
  currenciesOrder: {
    key: "marketCap",
    order: "desc",
    metaCurrencyIds: ["urn:crypto:meta-currency:injective_protocol"],
  },
};

export const mockAssetsDataWithPagination = {
  ...mockAssetsData,
  pagination: {
    nextCursor: "cursor-1",
  },
};

// Bitcoin mock data
const mockBitcoinCurrency = {
  type: "CryptoCurrency" as const,
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  units: [
    {
      name: "BTC",
      code: "BTC",
      magnitude: 8,
    },
  ],
  family: "bitcoin",
  managerAppName: "Bitcoin",
  coinType: 0,
  scheme: "bitcoin",
  color: "#FF9900",
  explorerViews: [],
};

export const mockBitcoinAssetsData = {
  cryptoAssets: {
    bitcoin: {
      id: "bitcoin",
      ticker: "BTC",
      name: "Bitcoin",
      assetsIds: {
        bitcoin: "bitcoin",
        ethereum: "ethereum/erc20/wrapped_bitcoin",
      },
    },
  },
  networks: {
    bitcoin: { id: "bitcoin", name: "Bitcoin" },
    ethereum: { id: "ethereum", name: "Ethereum" },
  },
  cryptoOrTokenCurrencies: {
    bitcoin: mockBitcoinCurrency,
    "ethereum/erc20/wrapped_bitcoin": {
      type: "TokenCurrency" as const,
      id: "ethereum/erc20/wrapped_bitcoin",
      name: "Wrapped Bitcoin",
      ticker: "WBTC",
      contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      parentCurrency: mockEthereumCurrency,
      tokenType: "erc20",
      units: [
        {
          name: "WBTC",
          code: "WBTC",
          magnitude: 8,
        },
      ],
    },
  },
  interestRates: {},
  markets: {},
  currenciesOrder: {
    key: "marketCap",
    order: "desc",
    metaCurrencyIds: ["bitcoin"],
  },
};

// USDC mock data
const mockPolygonCurrency = {
  type: "CryptoCurrency" as const,
  id: "polygon",
  name: "Polygon",
  ticker: "MATIC",
  units: [
    {
      name: "MATIC",
      code: "MATIC",
      magnitude: 18,
    },
  ],
  family: "evm",
  managerAppName: "Polygon",
  coinType: 60,
  scheme: "polygon",
  color: "#8247E5",
  explorerViews: [],
};

export const mockUsdcAssetsData = {
  cryptoAssets: {
    usdc: {
      id: "usdc",
      ticker: "USDC",
      name: "USD Coin",
      assetsIds: {
        ethereum: "ethereum/erc20/usd_coin",
        polygon: "polygon/erc20/usd_coin",
      },
    },
  },
  networks: {
    ethereum: { id: "ethereum", name: "Ethereum" },
    polygon: { id: "polygon", name: "Polygon" },
  },
  cryptoOrTokenCurrencies: {
    "ethereum/erc20/usd_coin": {
      type: "TokenCurrency" as const,
      id: "ethereum/erc20/usd_coin",
      name: "USD Coin",
      ticker: "USDC",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      parentCurrency: mockEthereumCurrency,
      tokenType: "erc20",
      units: [
        {
          name: "USDC",
          code: "USDC",
          magnitude: 6,
        },
      ],
    },
    "polygon/erc20/usd_coin": {
      type: "TokenCurrency" as const,
      id: "polygon/erc20/usd_coin",
      name: "USD Coin (Polygon)",
      ticker: "USDC",
      contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      parentCurrency: mockPolygonCurrency,
      tokenType: "erc20",
      units: [
        {
          name: "USDC",
          code: "USDC",
          magnitude: 6,
        },
      ],
    },
  },
  interestRates: {},
  markets: {},
  currenciesOrder: {
    key: "marketCap",
    order: "desc",
    metaCurrencyIds: ["usdc"],
  },
};
