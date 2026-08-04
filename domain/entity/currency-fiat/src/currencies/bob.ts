import { fiat } from "../define";

export const bob = fiat({
  type: "FiatCurrency",
  ticker: "BOB",
  name: "Bolivian Boliviano",
  symbol: "Bs",
  units: [
    {
      code: "Bs",
      name: "Bolivian Boliviano",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
