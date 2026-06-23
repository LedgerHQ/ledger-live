import { fiat } from "../define";

export const uah = fiat({
  type: "FiatCurrency",
  id: "uah",
  ticker: "UAH",
  name: "Ukrainian Hryvnia",
  symbol: "₴",
  units: [
    {
      code: "₴",
      name: "Ukrainian Hryvnia",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
