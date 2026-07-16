import { fiat } from "../define";

export const iqd = fiat({
  type: "FiatCurrency",
  id: "iqd",
  ticker: "IQD",
  name: "Iraqi Dinar",
  symbol: "د.ع.‏",
  units: [
    {
      code: "د.ع.‏",
      name: "Iraqi Dinar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
