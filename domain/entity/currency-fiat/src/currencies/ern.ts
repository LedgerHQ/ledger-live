import { fiat } from "../define";

export const ern = fiat({
  type: "FiatCurrency",
  id: "ern",
  ticker: "ERN",
  name: "Eritrean Nakfa",
  symbol: "Nfk",
  units: [
    {
      code: "Nfk",
      name: "Eritrean Nakfa",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
