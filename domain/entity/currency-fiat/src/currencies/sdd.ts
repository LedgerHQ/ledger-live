import { fiat } from "../define";

export const sdd = fiat({
  type: "FiatCurrency",
  id: "sdd",
  ticker: "SDD",
  name: "Sudanese Dinar (1992-2007)",
  symbol: "LSd",
  units: [
    {
      code: "LSd",
      name: "Sudanese Dinar (1992-2007)",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
