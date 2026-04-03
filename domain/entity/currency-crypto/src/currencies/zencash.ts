import { currency } from "../define";

export const zencash = currency({
  type: "CryptoCurrency",
  id: "zencash",
  coinType: 121,
  name: "Horizen",
  managerAppName: "Horizen",
  ticker: "ZEN",
  scheme: "zencash",
  color: "#152f5c",
  family: "bitcoin",
  blockAvgTime: 150,
  bitcoinLikeInfo: {
    P2PKH: 8329,
    P2SH: 8342,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "zencash",
      code: "ZEN",
      magnitude: 8,
    },
    {
      name: "satoshi",
      code: "sat",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.zensystem.io/tx/$hash",
      address: "https://explorer.zensystem.io/address/$address",
    },
  ],
  explorerId: "zen",
});
