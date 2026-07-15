import { fiat } from "../define";

export const mad = fiat({
  type: "FiatCurrency",
  id: "mad",
  ticker: "MAD",
  name: "Moroccan Dirham",
  symbol: "د.م.‏",
  units: [
    {
      code: "د.م.‏",
      name: "Moroccan Dirham",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
