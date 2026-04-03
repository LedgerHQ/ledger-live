import { currency } from "../define";

export const canton_network_devnet = currency({
  type: "CryptoCurrency",
  id: "canton_network_devnet",
  coinType: 6767,
  name: "Canton Network (Devnet)",
  managerAppName: "Canton",
  ticker: "CC",
  scheme: "canton_network_devnet",
  color: "#F3FF97",
  family: "canton",
  blockAvgTime: 100,
  isTestnetFor: "canton_network",
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
      tx: "https://devnet.ccview.io/updates/$hash",
      address: "https://devnet.ccview.io/party/$address",
    },
  ],
  keywords: ["canton_network_devnet"],
});
