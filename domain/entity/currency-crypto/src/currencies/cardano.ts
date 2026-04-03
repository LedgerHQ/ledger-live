import { currency } from "../define";

export const cardano = currency({
  type: "CryptoCurrency",
  id: "cardano",
  coinType: 1815,
  name: "Cardano",
  managerAppName: "Cardano ADA",
  ticker: "ADA",
  scheme: "cardano",
  color: "#0A1D2C",
  family: "cardano",
  blockAvgTime: 20,
  units: [
    {
      name: "ada",
      code: "ADA",
      magnitude: 6,
    },
    {
      name: "Lovelace",
      code: "Lovelace",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://cardanoscan.io/transaction/$hash",
      address: "https://cardanoscan.io/address/$address",
      stakePool: "https://cardanoscan.io/pool/$poolId",
    },
  ],
  keywords: ["ada", "cardano"],
  tokenTypes: ["native"],
});
