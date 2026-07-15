import { fiat } from "../define";

export const wst = fiat({
  type: "FiatCurrency",
  id: "wst",
  ticker: "WST",
  name: "Samoan Tala",
  symbol: "WS$",
  units: [
    {
      code: "WS$",
      name: "Samoan Tala",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
