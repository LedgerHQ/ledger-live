import { buildCategoryResponse } from "./categoryResponse.mock";

export const mockStocksResponse = buildCategoryResponse([
  {
    ticker: "AAPLX",
    slug: "applex",
    name: "Apple xStock",
    token: {
      network: "solana",
      tokenType: "spl",
      contractAddress: "XsAAPL000000000000000000000000000000000000",
    },
    market: { price: 226.4, marketCap: 3_400_000_000_000, priceChangePercentage24h: 1.2 },
  },
  {
    ticker: "TSLAX",
    slug: "teslax",
    name: "Tesla xStock",
    token: {
      network: "solana",
      tokenType: "spl",
      contractAddress: "XsTSLA000000000000000000000000000000000000",
    },
    market: { price: 248.5, marketCap: 790_000_000_000, priceChangePercentage24h: -0.8 },
  },
]);
