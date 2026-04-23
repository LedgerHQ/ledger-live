import { currency } from "../define";

export const injective = currency({
  type: "CryptoCurrency",
  id: "injective",
  coinType: 60,
  name: "Injective",
  managerAppName: "Cosmos",
  ticker: "INJ",
  scheme: "injective",
  color: "#0bd",
  family: "cosmos",
  units: [
    {
      name: "Injective",
      code: "INJ",
      magnitude: 18,
    },
    {
      name: "Micro-Injective",
      code: "inj",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/injective/txs/$hash",
      address: "https://www.mintscan.io/injective/validators/$address",
    },
  ],
});
