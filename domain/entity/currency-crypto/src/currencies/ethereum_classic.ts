import { currency } from "../define";

export const ethereum_classic = currency({
  type: "CryptoCurrency",
  id: "ethereum_classic",
  coinType: 61,
  name: "Ethereum Classic",
  managerAppName: "Ethereum Classic",
  ticker: "ETC",
  scheme: "ethereumclassic",
  color: "#3ca569",
  units: [
    {
      name: "ETC",
      code: "ETC",
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
  family: "evm",
  blockAvgTime: 15,
  ethereumLikeInfo: {
    chainId: 61,
  },
  explorerViews: [
    {
      tx: "https://blockscout.com/etc/mainnet/tx/$hash/internal-transactions",
      address: "https://blockscout.com/etc/mainnet/address/$address/transactions",
    },
  ],
  keywords: ["etc", "ethereum classic"],
  explorerId: "etc",
});
