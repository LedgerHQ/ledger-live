import { currency } from "../define";

export const bitlayer = currency({
  type: "CryptoCurrency",
  id: "bitlayer",
  coinType: 60,
  name: "Bitlayer",
  managerAppName: "Ethereum",
  ticker: "BTC",
  scheme: "bitlayer",
  color: "#F7931A",
  family: "evm",
  units: [
    {
      name: "BTC",
      code: "BTC",
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
    chainId: 200901,
  },
  explorerViews: [
    {
      tx: "https://www.btrscan.com/tx/$hash",
      address: "https://www.btrscan.com/address/$address",
      token: "https://www.btrscan.com/token/$contractAddress?a=$address",
    },
  ],
});
