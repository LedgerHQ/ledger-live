import { currency } from "../define";

export const dogecoin = currency({
  type: "CryptoCurrency",
  id: "dogecoin",
  coinType: 3,
  name: "Dogecoin",
  managerAppName: "Dogecoin",
  ticker: "DOGE",
  scheme: "dogecoin",
  color: "#65d196",
  family: "bitcoin",
  blockAvgTime: 60,
  bitcoinLikeInfo: {
    P2PKH: 30,
    P2SH: 22,
    XPUBVersion: 49990397,
  },
  symbol: "Ð",
  units: [
    {
      name: "dogecoin",
      code: "DOGE",
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
      tx: "https://dogechain.info/tx/$hash",
      address: "https://dogechain.info/address/$address",
    },
  ],
  keywords: ["doge", "dogecoin"],
  explorerId: "doge",
});
