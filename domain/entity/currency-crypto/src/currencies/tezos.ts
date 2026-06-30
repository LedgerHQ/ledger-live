import { currency } from "../define";

export const tezos = currency({
  type: "CryptoCurrency",
  id: "tezos",
  coinType: 1729,
  name: "Tezos",
  managerAppName: "Tezos Wallet",
  ticker: "XTZ",
  scheme: "tezos",
  color: "#007BFF",
  keywords: ["xtz", "tezos"],
  family: "tezos",
  blockAvgTime: 60,
  units: [
    {
      name: "XTZ",
      code: "XTZ",
      magnitude: 6,
    },
  ],
  explorerViews: [
    {
      tx: "https://tzkt.io/$hash",
      address: "https://tzkt.io/$address",
    },
  ],
});
