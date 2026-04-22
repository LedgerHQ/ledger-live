import { currency } from "../define";

export const hyperevm = currency({
  type: "CryptoCurrency",
  id: "hyperevm",
  coinType: 60,
  name: "HyperEVM",
  managerAppName: "Ethereum",
  ticker: "HYPE",
  scheme: "hyperevm",
  color: "#97FCE4",
  family: "evm",
  units: [
    {
      name: "HYPE",
      code: "HYPE",
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
    chainId: 999,
  },
  explorerViews: [
    {
      tx: "https://www.hyperscan.com/tx/$hash",
      address: "https://www.hyperscan.com/address/$address",
      token: "https://www.hyperscan.com/token/$contractAddress",
    },
  ],
});
