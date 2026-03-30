import { currency } from "../define";

export const mantle = currency({
  type: "CryptoCurrency",
  id: "mantle",
  coinType: 60,
  name: "Mantle",
  managerAppName: "Ethereum",
  ticker: "MNT",
  scheme: "mantle",
  color: "#0E121B",
  family: "evm",
  units: [
    {
      name: "MNT",
      code: "MNT",
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
    chainId: 5000,
  },
  explorerViews: [
    {
      tx: "https://explorer.mantle.xyz/tx/$hash",
      address: "https://explorer.mantle.xyz/address/$address",
      token:
        "https://explorer.mantle.xyz/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
  keywords: ["mantle"],
});
