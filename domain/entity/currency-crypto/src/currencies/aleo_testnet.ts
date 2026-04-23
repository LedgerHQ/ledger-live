import { currency } from "../define";

export const aleo_testnet = currency({
  type: "CryptoCurrency",
  id: "aleo_testnet",
  coinType: 683,
  name: "Aleo (Testnet)",
  managerAppName: "Aleo",
  ticker: "ALEO",
  scheme: "aleo_testnet",
  color: "#121212",
  family: "aleo",
  isTestnetFor: "aleo",
  units: [
    {
      name: "Aleo",
      code: "ALEO",
      magnitude: 6,
    },
  ],
  explorerViews: [
    {
      tx: "https://testnet.explorer.provable.com/transaction/$hash",
      address: "https://testnet.explorer.provable.com/address/$address",
    },
  ],
});
