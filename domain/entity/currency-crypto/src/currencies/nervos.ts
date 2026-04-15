import { currency } from "../define";

export const nervos = currency({
  type: "CryptoCurrency",
  id: "nervos",
  coinType: 309,
  name: "Nervos",
  managerAppName: "Nervos",
  ticker: "CKB",
  scheme: "nervos",
  color: "#3EC58A",
  family: "nervos",
  units: [
    {
      name: "CKB",
      code: "CKB",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.nervos.org/transaction/$hash",
      address: "https://explorer.nervos.org/address/$address",
    },
  ],
});
