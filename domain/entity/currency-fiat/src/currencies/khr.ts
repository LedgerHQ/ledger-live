import { fiat } from "../define";

export const khr = fiat({
  type: "FiatCurrency",
  id: "khr",
  ticker: "KHR",
  name: "Cambodian Riel",
  symbol: "៛",
  units: [
    {
      code: "៛",
      name: "Cambodian Riel",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
