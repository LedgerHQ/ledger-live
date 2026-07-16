import { fiat } from "../define";

export const zmw = fiat({
  type: "FiatCurrency",
  id: "zmw",
  ticker: "ZMW",
  name: "Zambian Kwacha",
  symbol: "ZK",
  units: [
    {
      code: "ZK",
      name: "Zambian Kwacha",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
