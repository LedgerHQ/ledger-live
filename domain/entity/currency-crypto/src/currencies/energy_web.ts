import { currency } from "../define";

export const energy_web = currency({
  type: "CryptoCurrency",
  id: "energy_web",
  coinType: 60,
  name: "Energy Web",
  managerAppName: "Ethereum",
  ticker: "EWT",
  scheme: "energy_web",
  color: "#A566FF",
  family: "evm",
  units: [
    {
      name: "EWT",
      code: "EWT",
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
    chainId: 246,
  },
  explorerViews: [
    {
      tx: "https://explorer.energyweb.org/tx/$hash",
      address: "https://explorer.energyweb.org/address/$address",
      token:
        "https://explorer.energyweb.org/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
