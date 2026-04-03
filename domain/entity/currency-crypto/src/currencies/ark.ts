import { currency } from "../define";

export const ark = currency({
  type: "CryptoCurrency",
  id: "ark",
  coinType: 111,
  name: "Ark",
  managerAppName: "Ark",
  ticker: "ARK",
  scheme: "ark",
  color: "#dd3333",
  family: "ark",
  units: [
    {
      name: "ARK",
      code: "ARK",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.ark.io/transaction/$hash",
    },
  ],
});
