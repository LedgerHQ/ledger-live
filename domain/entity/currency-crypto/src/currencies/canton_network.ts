import { currency } from "../define";

export const canton_network = currency({
  type: "CryptoCurrency",
  id: "canton_network",
  coinType: 6767,
  name: "Canton Network",
  managerAppName: "Canton",
  ticker: "CC",
  scheme: "canton_network",
  color: "#F3FF97",
  family: "canton",
  blockAvgTime: 100,
  units: [
    {
      name: "cc",
      code: "CC",
      magnitude: 38,
    },
    {
      name: "ucc",
      code: "ucc",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://ccview.io/updates/$hash",
      address: "https://ccview.io/party/$address",
    },
  ],
  keywords: ["canton_network"],
});
