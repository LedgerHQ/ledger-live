import { currency } from "../define";

export const fantom = currency({
  type: "CryptoCurrency",
  id: "fantom",
  coinType: 60,
  name: "Fantom",
  managerAppName: "Ethereum",
  ticker: "FTM",
  scheme: "fantom",
  color: "#1969ff",
  family: "evm",
  units: [
    {
      name: "FTM",
      code: "FTM",
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
    chainId: 250,
  },
  explorerViews: [
    {
      tx: "https://web3.okx.com/explorer/fantom/tx/$hash",
      address: "https://web3.okx.com/explorer/fantom/address/$address",
      token: "https://web3.okx.com/explorer/fantom/token/$contractAddress",
    },
  ],
});
