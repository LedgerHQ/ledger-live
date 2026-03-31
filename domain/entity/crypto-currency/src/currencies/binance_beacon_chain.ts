import { currency } from "../define";

export const binance_beacon_chain = currency({
  type: "CryptoCurrency",
  id: "binance_beacon_chain",
  coinType: 118,
  name: "BinanceBeaconChain",
  managerAppName: "Cosmos",
  ticker: "BNB",
  scheme: "BinanceBeaconChain",
  color: "#f0b90b",
  family: "cosmos",
  units: [
    {
      name: "BNB",
      code: "BNB",
      magnitude: 6,
    },
    {
      name: "Micro-BNB",
      code: "ubnb",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://binance.mintscan.io/txs/$hash",
      address: "https://binance.mintscan.io/validators/$address",
    },
  ],
});
