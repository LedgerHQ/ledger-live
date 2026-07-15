import { fiat } from "../define";

export const crc = fiat({
  type: "FiatCurrency",
  id: "crc",
  ticker: "CRC",
  name: "Costa Rican Colón",
  symbol: "₡",
  units: [
    {
      code: "₡",
      name: "Costa Rican Colón",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
