import { currency } from "../define";

export const optimism = currency({
  type: "CryptoCurrency",
  id: "optimism",
  coinType: 60,
  name: "OP Mainnet",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "optimism",
  color: "#FF0421",
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
  ethereumLikeInfo: {
    chainId: 10,
  },
  explorerViews: [
    {
      tx: "https://optimism.blockscout.com/tx/$hash",
      address: "https://optimism.blockscout.com/address/$address",
      token:
        "https://optimism.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
  keywords: ["optimism"],
});
