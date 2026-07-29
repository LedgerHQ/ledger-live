import { fiat } from "../define";

export const std = fiat({
  type: "FiatCurrency",
  ticker: "STD",
  name: "São Tomé and Príncipe Dobra",
  symbol: "Db",
  units: [
    {
      code: "Db",
      name: "São Tomé and Príncipe Dobra",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
