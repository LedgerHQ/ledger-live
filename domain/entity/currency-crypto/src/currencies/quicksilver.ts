import { currency } from "../define";

export const quicksilver = currency({
  type: "CryptoCurrency",
  id: "quicksilver",
  coinType: 118,
  name: "Quicksilver",
  managerAppName: "Cosmos",
  ticker: "QCK",
  scheme: "quicksilver",
  color: "#9b9b9b",
  family: "cosmos",
  units: [
    {
      name: "Quicksilver",
      code: "QCK",
      magnitude: 6,
    },
    {
      name: "Micro-Quicksilver",
      code: "uqck",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.quicksilver.zone/transactions/$hash",
      address: "https://explorer.quicksilver.zone/validators/$address",
    },
  ],
});
