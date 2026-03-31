import { currency } from "../define";

export const zenrock = currency({
  type: "CryptoCurrency",
  id: "zenrock",
  coinType: 118,
  name: "Zenrock",
  managerAppName: "Cosmos",
  ticker: "ROCK",
  scheme: "zenrock",
  color: "#080c44",
  family: "cosmos",
  units: [
    {
      name: "Zenrock",
      code: "ROCK",
      magnitude: 6,
    },
    {
      name: "Micro-Zenrock",
      code: "urock",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.diamond.zenrocklabs.io/transactions/$hash",
      address: "https://explorer.diamond.zenrocklabs.io/validators/$address",
    },
  ],
});
