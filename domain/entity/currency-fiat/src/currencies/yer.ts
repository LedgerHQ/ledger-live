import { fiat } from "../define";

export const yer = fiat({
  type: "FiatCurrency",
  id: "yer",
  ticker: "YER",
  name: "Yemeni Rial",
  symbol: "﷼",
  units: [
    {
      code: "﷼",
      name: "Yemeni Rial",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
