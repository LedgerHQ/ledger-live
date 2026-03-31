import { currency } from "../define";

export const hedera = currency({
  type: "CryptoCurrency",
  id: "hedera",
  coinType: 3030,
  name: "Hedera",
  managerAppName: "Hedera",
  ticker: "HBAR",
  scheme: "hedera",
  color: "#000",
  family: "hedera",
  units: [
    {
      name: "HBAR",
      code: "HBAR",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://hashscan.io/mainnet/transaction/$hash",
      address: "https://hashscan.io/mainnet/account/$address",
    },
  ],
  tokenTypes: ["hts", "erc20"],
});
