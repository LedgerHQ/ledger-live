import { fiat } from "../define";

export const mro = fiat({
  type: "FiatCurrency",
  id: "mro",
  ticker: "MRO",
  name: "Mauritanian Ouguiya",
  symbol: "UM",
  units: [
    {
      code: "UM",
      name: "Mauritanian Ouguiya",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
