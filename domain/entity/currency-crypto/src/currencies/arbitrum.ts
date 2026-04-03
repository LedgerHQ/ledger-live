import { currency } from "../define";

export const arbitrum = currency({
  type: "CryptoCurrency",
  id: "arbitrum",
  coinType: 60,
  name: "Arbitrum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "arbitrum",
  color: "#28a0f0",
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
    chainId: 42161,
  },
  explorerViews: [
    {
      tx: "https://arbitrum.blockscout.com/tx/$hash",
      address: "https://arbitrum.blockscout.com/address/$address",
      token:
        "https://arbitrum.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
