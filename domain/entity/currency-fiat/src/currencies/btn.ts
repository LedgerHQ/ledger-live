import { fiat } from "../define";

export const btn = fiat({
  type: "FiatCurrency",
  id: "btn",
  ticker: "BTN",
  name: "Bhutanese Ngultrum",
  symbol: "Nu.",
  units: [
    {
      code: "Nu.",
      name: "Bhutanese Ngultrum",
      magnitude: 1,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
