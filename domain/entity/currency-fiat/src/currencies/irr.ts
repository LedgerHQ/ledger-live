import { fiat } from "../define";

export const irr = fiat({
  type: "FiatCurrency",
  ticker: "IRR",
  name: "Iranian Rial",
  symbol: "﷼",
  units: [
    {
      code: "﷼",
      name: "Iranian Rial",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
