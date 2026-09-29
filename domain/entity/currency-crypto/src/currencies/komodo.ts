import { currency } from "../define";

export const komodo = currency({
  type: "CryptoCurrency",
  id: "komodo",
  coinType: 141,
  name: "Komodo",
  managerAppName: "Komodo",
  ticker: "KMD",
  scheme: "komodo",
  color: "#326464",
  family: "bitcoin",
  blockAvgTime: 60,
  units: [
    {
      name: "komodo",
      code: "KMD",
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
      tx: "https://kmdexplorer.io/tx/$hash",
      address: "https://kmdexplorer.io/address/$address",
    },
  ],
});
