import { currency } from "../define";

export const base_sepolia = currency({
  type: "CryptoCurrency",
  id: "base_sepolia",
  coinType: 60,
  name: "Base Sepolia",
  managerAppName: "Ethereum",
  ticker: "ETH",
  deviceTicker: "ETH",
  scheme: "base_sepolia",
  color: "#FF0000",
  family: "evm",
  units: [
    {
      name: "ETH",
      code: "ETH",
      magnitude: 18,
    },
    {
      name: "Gwei",
      code: "Gwei",
      magnitude: 9,
    },
    {
      name: "Mwei",
      code: "Mwei",
      magnitude: 6,
    },
    {
      name: "Kwei",
      code: "Kwei",
      magnitude: 3,
    },
    {
      name: "wei",
      code: "wei",
      magnitude: 0,
    },
  ],
  disableCountervalue: true,
  isTestnetFor: "base",
  ethereumLikeInfo: {
    chainId: 84532,
  },
  explorerViews: [
    {
      tx: "https://base-sepolia.blockscout.com/tx/$hash",
      address: "https://base-sepolia.blockscout.com/address/$address",
      token:
        "https://base-sepolia.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
