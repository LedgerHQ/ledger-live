import { currency } from "../define";

export const zilliqa = currency({
  type: "CryptoCurrency",
  id: "zilliqa",
  coinType: 313,
  name: "Zilliqa",
  managerAppName: "Zilliqa",
  ticker: "ZIL",
  scheme: "zilliqa",
  color: "#2CC0BE",
  family: "zilliqa",
  units: [
    {
      name: "ZIL",
      code: "ZIL",
      magnitude: 12,
    },
  ],
  explorerViews: [
    {
      tx: "https://viewblock.io/zilliqa/tx/$hash",
      address: "https://viewblock.io/zilliqa/address/$address",
    },
  ],
});
