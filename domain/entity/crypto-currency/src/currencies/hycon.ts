import { currency } from "../define";

export const hycon = currency({
  type: "CryptoCurrency",
  id: "hycon",
  coinType: 1397,
  name: "Hycon",
  managerAppName: "Hycon",
  ticker: "HYC",
  scheme: "hycon",
  color: "#00B3FF",
  family: "hycon",
  units: [
    {
      name: "HYCON",
      code: "HYCON",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.hycon.io/tx/$hash",
      address: "https://explorer.hycon.io/address/$address",
    },
  ],
});
