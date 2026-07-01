import { fiat } from "../define";

export const mdl = fiat({
  type: "FiatCurrency",
  id: "mdl",
  ticker: "MDL",
  name: "Moldovan Leu",
  symbol: "lei",
  units: [
    {
      code: "lei",
      name: "Moldovan Leu",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
