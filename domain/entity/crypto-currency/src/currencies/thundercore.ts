import { currency } from "../define";

export const thundercore = currency({
  type: "CryptoCurrency",
  id: "thundercore",
  coinType: 1001,
  name: "Thundercore",
  managerAppName: "Thundercore",
  ticker: "TT",
  scheme: "thundercore",
  color: "#0844D2",
  family: "evm",
  units: [
    {
      name: "TT",
      code: "TT",
      magnitude: 18,
    },
  ],
  explorerViews: [
    {
      tx: "https://viewblock.io/thundercore/tx/$hash",
      address: "https://viewblock.io/thundercore/address/$address",
    },
  ],
});
