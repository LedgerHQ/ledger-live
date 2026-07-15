import { fiat } from "../define";

export const veb = fiat({
  type: "FiatCurrency",
  id: "veb",
  ticker: "VEB",
  name: "Venezuelan Bolívar (1871–2008)",
  symbol: "Bs.",
  units: [
    {
      code: "Bs.",
      name: "Venezuelan Bolívar (1871–2008)",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
