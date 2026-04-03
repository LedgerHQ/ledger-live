import { currency } from "../define";

export const aptos_testnet = currency({
  type: "CryptoCurrency",
  id: "aptos_testnet",
  coinType: 637,
  name: "Aptos (Testnet)",
  managerAppName: "Aptos",
  ticker: "APT",
  scheme: "aptos_testnet",
  color: "#FFCD29",
  family: "aptos",
  isTestnetFor: "aptos",
  units: [
    {
      name: "APT",
      code: "APT",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      address: "https://explorer.aptoslabs.com/account/$address?network=testnet",
      tx: "https://explorer.aptoslabs.com/txn/$hash?network=testnet",
    },
  ],
});
