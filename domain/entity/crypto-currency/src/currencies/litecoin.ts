import { currency } from "../define";

export const litecoin = currency({
  type: "CryptoCurrency",
  id: "litecoin",
  coinType: 2,
  name: "Litecoin",
  managerAppName: "Litecoin",
  ticker: "LTC",
  scheme: "litecoin",
  color: "#cccccc",
  supportsSegwit: true,
  supportsNativeSegwit: true,
  family: "bitcoin",
  blockAvgTime: 300,
  bitcoinLikeInfo: {
    P2PKH: 48,
    P2SH: 50,
    XPUBVersion: 27108450,
  },
  symbol: "Ł",
  units: [
    {
      name: "litecoin",
      code: "LTC",
      magnitude: 8,
    },
    {
      name: "mLTC",
      code: "mLTC",
      magnitude: 5,
    },
    {
      name: "litoshi",
      code: "litoshi",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://live.blockcypher.com/ltc/tx/$hash",
      address: "https://live.blockcypher.com/ltc/address/$address",
    },
  ],
  keywords: ["ltc", "litecoin"],
  explorerId: "ltc",
});
