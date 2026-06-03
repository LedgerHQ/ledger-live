import { currency } from "../define";

export const hedera_testnet = currency({
  type: "CryptoCurrency",
  id: "hedera_testnet",
  coinType: 3030,
  name: "Hedera (Testnet)",
  managerAppName: "Hedera",
  ticker: "HBAR",
  scheme: "hedera_testnet",
  color: "#000",
  family: "hedera",
  isTestnetFor: "hedera",
  units: [
    {
      name: "HBAR",
      code: "HBAR",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://hashscan.io/testnet/transaction/$hash",
      address: "https://hashscan.io/testnet/account/$address",
    },
  ],
  tokenTypes: ["hts", "erc20"],
});
