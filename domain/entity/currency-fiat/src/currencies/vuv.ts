import { fiat } from "../define";

export const vuv = fiat({
  type: "FiatCurrency",
  id: "vuv",
  ticker: "VUV",
  name: "Vanuatu Vatu",
  symbol: "VT",
  units: [
    {
      code: "VT",
      name: "Vanuatu Vatu",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
