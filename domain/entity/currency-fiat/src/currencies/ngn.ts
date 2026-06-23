import { fiat } from "../define";

export const ngn = fiat({
  type: "FiatCurrency",
  id: "ngn",
  ticker: "NGN",
  name: "Nigerian Naira",
  symbol: "₦",
  units: [
    {
      code: "₦",
      name: "Nigerian Naira",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
