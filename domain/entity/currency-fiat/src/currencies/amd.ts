import { fiat } from "../define";

export const amd = fiat({
  type: "FiatCurrency",
  id: "amd",
  ticker: "AMD",
  name: "Armenian Dram",
  symbol: "֏",
  units: [
    {
      code: "֏",
      name: "Armenian Dram",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
