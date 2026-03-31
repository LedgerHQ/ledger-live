import { currency } from "../define";

export const bitcoin = currency({
  type: "CryptoCurrency",
  id: "bitcoin",
  coinType: 0,
  name: "Bitcoin",
  managerAppName: "Bitcoin",
  ticker: "BTC",
  scheme: "bitcoin",
  color: "#ffae35",
  symbol: "Ƀ",
  units: [
    {
      name: "bitcoin",
      code: "BTC",
      magnitude: 8,
    },
    {
      name: "mBTC",
      code: "mBTC",
      magnitude: 5,
    },
    {
      name: "bit",
      code: "bit",
      magnitude: 2,
    },
    {
      name: "satoshi",
      code: "sat",
      magnitude: 0,
    },
  ],
  supportsSegwit: true,
  supportsNativeSegwit: true,
  family: "bitcoin",
  blockAvgTime: 900,
  bitcoinLikeInfo: {
    P2PKH: 0,
    P2SH: 5,
    XPUBVersion: 76067358,
  },
  explorerViews: [
    {
      address: "https://blockstream.info/address/$address",
      tx: "https://blockstream.info/tx/$hash",
    },
    {
      address: "https://www.blockchain.com/btc/address/$address",
      tx: "https://blockchain.info/btc/tx/$hash",
    },
  ],
  keywords: ["btc", "bitcoin"],
  explorerId: "btc",
});
