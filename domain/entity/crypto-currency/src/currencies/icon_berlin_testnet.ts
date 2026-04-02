import { currency } from "../define";

export const icon_berlin_testnet = currency({
  type: "CryptoCurrency",
  id: "icon_berlin_testnet",
  coinType: 4801368,
  name: "ICON Berlin Testnet",
  managerAppName: "ICON",
  ticker: "ICX",
  scheme: "icon_berlin_testnet",
  color: "#00A3B4",
  family: "icon",
  isTestnetFor: "icon",
  units: [
    {
      name: "ICX",
      code: "ICX",
      magnitude: 18,
    },
  ],
  explorerViews: [
    {
      tx: "https://tracker.berlin.icon.community/transaction/$hash",
      address: "https://tracker.berlin.icon.community/address/$address",
    },
  ],
});
