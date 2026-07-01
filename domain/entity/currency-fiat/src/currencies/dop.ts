import { fiat } from "../define";

export const dop = fiat({
  type: "FiatCurrency",
  id: "dop",
  ticker: "DOP",
  name: "Dominican Peso",
  symbol: "RD$",
  units: [
    {
      code: "RD$",
      name: "Dominican Peso",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
