import { currency } from "../define";

export const rise = currency({
  type: "CryptoCurrency",
  id: "rise",
  coinType: 1120,
  name: "Rise",
  managerAppName: "Rise",
  ticker: "RISE",
  scheme: "rise",
  color: "#FC1E4F",
  family: "rise",
  blockAvgTime: 30,
  units: [
    {
      name: "RISE",
      code: "RISE",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.rise.vision/tx/$hash",
      address: "https://explorer.rise.vision/tx/$address",
    },
  ],
});
