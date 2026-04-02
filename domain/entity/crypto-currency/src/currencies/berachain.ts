import { currency } from "../define";

export const berachain = currency({
  type: "CryptoCurrency",
  id: "berachain",
  coinType: 60,
  name: "Berachain",
  managerAppName: "Ethereum",
  ticker: "BERA",
  scheme: "berachain",
  color: "#814625",
  family: "evm",
  units: [
    {
      name: "BERA",
      code: "BERA",
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
    chainId: 80094,
  },
  explorerViews: [
    {
      tx: "https://berascan.com/tx/$hash",
      address: "https://berascan.com/address/$address",
      token: "https://berascan.com/token/$contractAddress?a=$address",
    },
  ],
});
