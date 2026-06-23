import { fiat } from "../define";

export const srd = fiat({
  type: "FiatCurrency",
  id: "srd",
  ticker: "SRD",
  name: "Surinamese Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Surinamese Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
