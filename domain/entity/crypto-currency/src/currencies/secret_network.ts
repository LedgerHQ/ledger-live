import { currency } from "../define";

export const secret_network = currency({
  type: "CryptoCurrency",
  id: "secret_network",
  coinType: 118,
  name: "SecretNetwork",
  managerAppName: "Cosmos",
  ticker: "SCRT",
  scheme: "secret_network",
  color: "#a3b0bd",
  family: "cosmos",
  units: [
    {
      name: "Secret",
      code: "SCRT",
      magnitude: 6,
    },
    {
      name: "Micro-Secret",
      code: "uscrt",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/secret/txs/$hash",
      address: "https://www.mintscan.io/secret/validators/$address",
    },
  ],
});
