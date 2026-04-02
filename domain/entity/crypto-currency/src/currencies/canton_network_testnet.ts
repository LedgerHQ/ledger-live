import { currency } from "../define";

export const canton_network_testnet = currency({
  type: "CryptoCurrency",
  id: "canton_network_testnet",
  coinType: 6767,
  name: "Canton Network (Testnet)",
  managerAppName: "Canton",
  ticker: "CC",
  scheme: "canton_network_testnet",
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
      tx: "https://testnet.ccview.io/updates/$hash",
      address: "https://testnet.ccview.io/party/$address",
    },
  ],
  keywords: ["canton_network_testnet"],
});
