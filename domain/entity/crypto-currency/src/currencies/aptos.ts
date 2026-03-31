import { currency } from "../define";

export const aptos = currency({
  type: "CryptoCurrency",
  id: "aptos",
  coinType: 637,
  name: "Aptos",
  managerAppName: "Aptos",
  ticker: "APT",
  scheme: "aptos",
  color: "#231F20",
  family: "aptos",
  units: [
    {
      name: "APT",
      code: "APT",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      address: "https://explorer.aptoslabs.com/account/$address?network=mainnet",
      tx: "https://explorer.aptoslabs.com/txn/$hash?network=mainnet",
    },
  ],
});
