import { currency } from "../define";

export const cosmos = currency({
  type: "CryptoCurrency",
  id: "cosmos",
  coinType: 118,
  name: "Cosmos",
  managerAppName: "Cosmos",
  ticker: "ATOM",
  scheme: "cosmos",
  color: "#16192f",
  family: "cosmos",
  units: [
    {
      name: "Atom",
      code: "ATOM",
      magnitude: 6,
    },
    {
      name: "microAtom",
      code: "uatom",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/cosmos/txs/$hash",
      address: "https://www.mintscan.io/cosmos/validators/$address",
    },
  ],
  keywords: ["atom", "cosmos"],
});
