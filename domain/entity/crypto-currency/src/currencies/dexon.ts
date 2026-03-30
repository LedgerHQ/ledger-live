import { currency } from "../define";

export const dexon = currency({
  type: "CryptoCurrency",
  id: "dexon",
  coinType: 237,
  name: "DEXON",
  managerAppName: "DEXON",
  ticker: "DXN",
  scheme: "dexon",
  color: "#000000",
  family: "evm",
  units: [
    {
      name: "dexon",
      code: "DXN",
      magnitude: 6,
    },
  ],
  explorerViews: [
    {
      tx: "https://dexonscan.app/transaction/$hash",
      address: "https://dexonscan.app/address/$address",
    },
  ],
});
