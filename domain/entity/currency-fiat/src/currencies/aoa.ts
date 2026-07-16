import { fiat } from "../define";

export const aoa = fiat({
  type: "FiatCurrency",
  id: "aoa",
  ticker: "AOA",
  name: "Angolan Kwanza",
  symbol: "Kz",
  units: [
    {
      code: "Kz",
      name: "Angolan Kwanza",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
