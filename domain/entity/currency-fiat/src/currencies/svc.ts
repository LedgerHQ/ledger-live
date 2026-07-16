import { fiat } from "../define";

export const svc = fiat({
  type: "FiatCurrency",
  id: "svc",
  ticker: "SVC",
  name: "Salvadoran Colón",
  symbol: "₡",
  units: [
    {
      code: "₡",
      name: "Salvadoran Colón",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
