import { currency } from "../define";

export const icon = currency({
  type: "CryptoCurrency",
  id: "icon",
  coinType: 4801368,
  name: "ICON",
  managerAppName: "ICON",
  ticker: "ICX",
  scheme: "icon",
  color: "#00A3B4",
  family: "icon",
  units: [
    {
      name: "ICX",
      code: "ICX",
      magnitude: 18,
    },
  ],
  explorerViews: [
    {
      tx: "https://tracker.icon.community/transaction/$hash",
      address: "https://tracker.icon.community/address/$address",
    },
  ],
});
