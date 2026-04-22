import { currency } from "../define";

export const cosmos_testnet = currency({
  type: "CryptoCurrency",
  id: "cosmos_testnet",
  coinType: 118,
  name: "Cosmos (Testnet)",
  managerAppName: "Cosmos",
  ticker: "MUON",
  scheme: "cosmos_testnet",
  isTestnetFor: "cosmos",
  disableCountervalue: true,
  color: "#16192f",
  family: "cosmos",
  units: [
    {
      name: "Muon",
      code: "MUON",
      magnitude: 6,
    },
    {
      name: "microMuon",
      code: "umuon",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://testnet.mintscan.io/txs/$hash",
      address: "https://testnet.mintscan.io/validators/$address",
    },
  ],
});
