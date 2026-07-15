import { fiat } from "../define";

export const mxn = fiat({
  type: "FiatCurrency",
  id: "mxn",
  ticker: "MXN",
  name: "Mexican Peso",
  symbol: "Mex$",
  units: [
    {
      code: "Mex$",
      name: "Mexican Peso",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
