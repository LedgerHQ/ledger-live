import { fiat } from "../define";

export const cuc = fiat({
  type: "FiatCurrency",
  ticker: "CUC",
  name: "Cuban Convertible Peso",
  symbol: "CUC",
  units: [
    {
      code: "CUC",
      name: "Cuban Convertible Peso",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
