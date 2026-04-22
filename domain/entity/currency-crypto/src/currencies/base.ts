import { currency } from "../define";

export const base = currency({
  type: "CryptoCurrency",
  id: "base",
  coinType: 60,
  name: "Base",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "base",
  color: "#1755FE",
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
    chainId: 8453,
  },
  explorerViews: [
    {
      tx: "https://base.blockscout.com/tx/$hash",
      address: "https://base.blockscout.com/address/$address",
      token:
        "https://base.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
