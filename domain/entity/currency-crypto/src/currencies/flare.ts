import { currency } from "../define";

export const flare = currency({
  type: "CryptoCurrency",
  id: "flare",
  coinType: 60,
  name: "Flare",
  managerAppName: "Ethereum",
  ticker: "FLR",
  scheme: "flare",
  color: "#D95F6C",
  family: "evm",
  ethereumLikeInfo: {
    chainId: 14,
  },
  units: [
    {
      name: "FLR",
      code: "FLR",
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
  explorerViews: [
    {
      tx: "https://flare-explorer.flare.network/tx/$hash",
      address: "https://flare-explorer.flare.network/address/$address",
      token:
        "https://flare-explorer.flare.network/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
