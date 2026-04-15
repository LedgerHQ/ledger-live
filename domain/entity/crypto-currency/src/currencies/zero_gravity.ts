import { currency } from "../define";

export const zero_gravity = currency({
  type: "CryptoCurrency",
  id: "zero_gravity",
  coinType: 60,
  name: "0G",
  managerAppName: "Ethereum",
  ticker: "0G",
  scheme: "zero_gravity",
  color: "#9200E1",
  family: "evm",
  units: [
    {
      name: "0G",
      code: "0G",
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
    chainId: 16661,
  },
  explorerViews: [
    {
      tx: "https://chainscan.0g.ai/tx/$hash",
      address: "https://chainscan.0g.ai/address/$address",
    },
  ],
});
