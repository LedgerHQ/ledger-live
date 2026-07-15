import { fiat } from "../define";

export const vef = fiat({
  type: "FiatCurrency",
  id: "vef",
  ticker: "VEF",
  name: "Venezuelan Bolívar (2008–2018)",
  symbol: "Bs. F.",
  units: [
    {
      code: "Bs. F.",
      name: "Venezuelan Bolívar (2008–2018)",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
