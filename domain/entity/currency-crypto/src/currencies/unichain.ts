import { currency } from "../define";

export const unichain = currency({
  type: "CryptoCurrency",
  id: "unichain",
  coinType: 60,
  name: "Unichain",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "unichain",
  color: "#f50fb4",
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
    chainId: 130,
  },
  explorerViews: [
    {
      tx: "https://uniscan.xyz/tx/$hash",
      address: "https://uniscan.xyz/address/$address",
      token: "https://uniscan.xyz/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
  keywords: ["unichain"],
});
