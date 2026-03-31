import { currency } from "../define";

export const optimism_sepolia = currency({
  type: "CryptoCurrency",
  id: "optimism_sepolia",
  coinType: 60,
  name: "OP Sepolia",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "optimism_sepolia",
  color: "#FF0000",
  family: "evm",
  units: [
    {
      name: "ether",
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
  isTestnetFor: "optimism",
  ethereumLikeInfo: {
    chainId: 11155420,
  },
  explorerViews: [
    {
      tx: "https://optimism-sepolia.blockscout.com/tx/$hash",
      address: "https://optimism-sepolia.blockscout.com/address/$address",
      token:
        "https://optimism-sepolia.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
