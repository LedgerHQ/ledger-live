import { currency } from "../define";

export const songbird = currency({
  type: "CryptoCurrency",
  id: "songbird",
  coinType: 60,
  name: "Songbird",
  managerAppName: "Ethereum",
  ticker: "SGB",
  scheme: "songbird",
  color: "#61ACD4",
  family: "evm",
  ethereumLikeInfo: {
    chainId: 19,
  },
  units: [
    {
      name: "SGB",
      code: "SGB",
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
      tx: "https://songbird-explorer.flare.network/tx/$hash",
      address: "https://songbird-explorer.flare.network/address/$address",
      token:
        "https://songbird-explorer.flare.network/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
