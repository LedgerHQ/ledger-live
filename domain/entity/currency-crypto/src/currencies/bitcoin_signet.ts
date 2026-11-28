import { currency } from "../define";

export const bitcoin_signet = currency({
  type: "CryptoCurrency",
  id: "bitcoin_signet",
  coinType: 1,
  name: "Bitcoin Signet",
  managerAppName: "Bitcoin Test",
  ticker: "BTC",
  scheme: "signet",
  color: "#00ff00",
  symbol: "Ƀ",
  units: [
    {
      name: "bitcoin",
      code: "𝚝BTC",
      magnitude: 8,
    },
    {
      name: "mBTC",
      code: "𝚝mBTC",
      magnitude: 5,
    },
    {
      name: "bit",
      code: "𝚝bit",
      magnitude: 2,
    },
    {
      name: "satoshi",
      code: "𝚝sat",
      magnitude: 0,
    },
  ],
  supportsSegwit: true,
  supportsNativeSegwit: true,
  isTestnetFor: "bitcoin",
  family: "bitcoin",
  blockAvgTime: 600,
  explorerViews: [
    {
      tx: "https://mempool.space/signet/tx/$hash",
      address: "https://mempool.space/signet/address/$address",
    },
  ],
});
