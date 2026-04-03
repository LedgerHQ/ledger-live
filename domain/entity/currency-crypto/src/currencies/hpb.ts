import { currency } from "../define";

export const hpb = currency({
  type: "CryptoCurrency",
  id: "hpb",
  coinType: 269,
  name: "High Performance Blockchain",
  managerAppName: "HPB",
  ticker: "HPB",
  scheme: "hpb",
  color: "#3B3BE2",
  family: "evm",
  units: [
    {
      name: "hpb",
      code: "HPB",
      magnitude: 18,
    },
  ],
  blockAvgTime: 6,
  explorerViews: [
    {
      tx: "https://hpbscan.org/tx/$hash",
      address: "https://hpbscan.org/address/$address",
    },
  ],
});
