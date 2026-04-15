import { currency } from "../define";

export const bitcoin_testnet = currency({
  type: "CryptoCurrency",
  id: "bitcoin_testnet",
  coinType: 1,
  name: "Bitcoin Testnet",
  managerAppName: "Bitcoin Test",
  ticker: "BTC",
  scheme: "testnet",
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
  deviceTicker: "TEST",
  supportsSegwit: true,
  supportsNativeSegwit: true,
  isTestnetFor: "bitcoin",
  disableCountervalue: true,
  family: "bitcoin",
  blockAvgTime: 900,
  bitcoinLikeInfo: {
    P2PKH: 111,
    P2SH: 196,
    XPUBVersion: 70617039,
  },
  explorerViews: [
    {
      tx: "https://live.blockcypher.com/btc-testnet/tx/$hash",
      address: "https://live.blockcypher.com/btc-testnet/address/$address",
    },
  ],
  explorerId: "btc_testnet",
});
