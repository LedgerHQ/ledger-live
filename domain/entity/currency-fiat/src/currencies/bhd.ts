import { fiat } from "../define";

export const bhd = fiat({
  type: "FiatCurrency",
  id: "bhd",
  ticker: "BHD",
  name: "Bahraini Dinar",
  symbol: "د.ب.",
  units: [
    {
      code: "د.ب.",
      name: "Bahraini Dinar",
      magnitude: 3,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
