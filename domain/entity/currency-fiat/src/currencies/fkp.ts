import { fiat } from "../define";

export const fkp = fiat({
  type: "FiatCurrency",
  id: "fkp",
  ticker: "FKP",
  name: "Falkland Islands Pound",
  symbol: "£",
  units: [
    {
      code: "£",
      name: "Falkland Islands Pound",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
