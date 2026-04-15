import { currency } from "../define";

export const shape = currency({
  type: "CryptoCurrency",
  id: "shape",
  coinType: 60,
  name: "Shape",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "shape",
  color: "#000000",
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
    chainId: 360,
  },
  explorerViews: [
    {
      tx: "https://shapescan.xyz/tx/$hash",
      address: "https://shapescan.xyz/address/$address",
      token: "https://shapescan.xyz/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
