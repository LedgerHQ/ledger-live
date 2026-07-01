import { fiat } from "../define";

export const pyg = fiat({
  type: "FiatCurrency",
  id: "pyg",
  ticker: "PYG",
  name: "Paraguayan Guarani",
  symbol: "₲",
  units: [
    {
      code: "₲",
      name: "Paraguayan Guarani",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
