const mockSolanaCurrency = {
  type: "CryptoCurrency" as const,
  id: "solana",
  name: "Solana",
  ticker: "SOL",
  units: [
    {
      name: "SOL",
      code: "SOL",
      magnitude: 9,
    },
  ],
  family: "solana",
  managerAppName: "Solana",
  coinType: 501,
  scheme: "solana",
  color: "#000000",
  explorerViews: [],
};

export const mockStocksResponse = {
  cryptoAssets: {
    "urn:crypto:meta-currency:applex": {
      id: "urn:crypto:meta-currency:applex",
      ticker: "AAPLX",
      name: "Apple xStock",
      assetsIds: {
        solana: "solana/spl/applex",
      },
    },
    "urn:crypto:meta-currency:teslax": {
      id: "urn:crypto:meta-currency:teslax",
      ticker: "TSLAX",
      name: "Tesla xStock",
      assetsIds: {
        solana: "solana/spl/teslax",
      },
    },
  },
  networks: {
    solana: { id: "solana", name: "Solana" },
  },
  cryptoOrTokenCurrencies: {
    "solana/spl/applex": {
      type: "TokenCurrency" as const,
      id: "solana/spl/applex",
      name: "Apple xStock",
      ticker: "AAPLX",
      contractAddress: "XsAAPL000000000000000000000000000000000000",
      parentCurrency: mockSolanaCurrency,
      tokenType: "spl",
      units: [
        {
          name: "AAPLX",
          code: "AAPLX",
          magnitude: 8,
        },
      ],
    },
    "solana/spl/teslax": {
      type: "TokenCurrency" as const,
      id: "solana/spl/teslax",
      name: "Tesla xStock",
      ticker: "TSLAX",
      contractAddress: "XsTSLA000000000000000000000000000000000000",
      parentCurrency: mockSolanaCurrency,
      tokenType: "spl",
      units: [
        {
          name: "TSLAX",
          code: "TSLAX",
          magnitude: 8,
        },
      ],
    },
  },
  interestRates: {},
  markets: {
    "urn:crypto:meta-currency:applex": {
      price: 226.4,
      marketCap: 3_400_000_000_000,
      priceChangePercentage24h: 1.2,
    },
    "urn:crypto:meta-currency:teslax": {
      price: 248.5,
      marketCap: 790_000_000_000,
      priceChangePercentage24h: -0.8,
    },
  },
  currenciesOrder: {
    key: "marketCap",
    order: "desc",
    metaCurrencyIds: ["urn:crypto:meta-currency:applex", "urn:crypto:meta-currency:teslax"],
  },
};
