import { currency } from "../define";

export const zksync_sepolia = currency({
  type: "CryptoCurrency",
  id: "zksync_sepolia",
  coinType: 60,
  name: "ZKsync Sepolia",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "zksync_sepolia",
  color: "#ff0000",
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
  ethereumLikeInfo: {
    chainId: 300,
  },
  explorerViews: [
    {
      tx: "https://zksync-sepolia.blockscout.com/tx/$hash",
      address: "https://zksync-sepolia.blockscout.com/address/$address",
      token:
        "https://zksync-sepolia.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
