import { currency } from "../define";

export const mantle_sepolia = currency({
  type: "CryptoCurrency",
  id: "mantle_sepolia",
  coinType: 60,
  name: "Mantle Sepolia",
  managerAppName: "Ethereum",
  ticker: "MNT",
  scheme: "mantle_sepolia",
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
  isTestnetFor: "mantle",
  disableCountervalue: true,
  ethereumLikeInfo: {
    chainId: 5003,
  },
  explorerViews: [
    {
      tx: "https://explorer.sepolia.mantle.xyz/tx/$hash",
      address: "https://explorer.sepolia.mantle.xyz/address/$address",
      token:
        "https://explorer.sepolia.mantle.xyz/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
