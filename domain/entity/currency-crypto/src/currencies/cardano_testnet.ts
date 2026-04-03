import { currency } from "../define";

export const cardano_testnet = currency({
  type: "CryptoCurrency",
  id: "cardano_testnet",
  coinType: 1815,
  name: "Cardano (Testnet)",
  managerAppName: "Cardano ADA",
  ticker: "tADA",
  scheme: "cardano_testnet",
  isTestnetFor: "cardano",
  disableCountervalue: true,
  color: "#0A1D2C",
  family: "cardano",
  blockAvgTime: 20,
  units: [
    {
      name: "ada",
      code: "tADA",
      magnitude: 6,
    },
    {
      name: "Lovelace",
      code: "tLovelace",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://preprod.cardanoscan.io/transaction/$hash",
      address: "https://prerpod.cardanoscan.io/address/$address",
      stakePool: "https://preprod.cardanoscan.io/pool/$poolId",
    },
  ],
});
