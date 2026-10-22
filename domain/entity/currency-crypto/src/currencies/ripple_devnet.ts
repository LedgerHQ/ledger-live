import { currency } from "../define";

export const ripple_devnet = currency({
  type: "CryptoCurrency",
  id: "ripple_devnet",
  coinType: 144,
  name: "XRP (Devnet)",
  managerAppName: "XRP",
  ticker: "XRP",
  scheme: "ripple_devnet",
  color: "#27a2db",
  units: [
    {
      name: "XRP",
      code: "XRP",
      magnitude: 6,
    },
    {
      name: "drop",
      code: "drop",
      magnitude: 0,
    },
  ],
  family: "xrp",
  isTestnetFor: "ripple",
  explorerViews: [
    {
      tx: "https://devnet.xrpl.org/transactions/$hash",
      address: "https://devnet.xrpl.org/accounts/$address",
    },
  ],
});
