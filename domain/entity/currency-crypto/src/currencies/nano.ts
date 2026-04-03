import { currency } from "../define";

export const nano = currency({
  type: "CryptoCurrency",
  id: "nano",
  coinType: 165,
  name: "Nano",
  managerAppName: "Nano",
  ticker: "NANO",
  scheme: "nano",
  color: "#4E8FB6",
  family: "nano",
  units: [
    {
      name: "NANO",
      code: "NANO",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://nanolooker.com/block/$hash",
      address: "https://nanolooker.com/account/$address",
    },
    {
      tx: "https://nanoexplorer.io/blocks/$hash",
    },
  ],
});
