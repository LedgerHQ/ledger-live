import { currency } from "../define";

export const monad = currency({
  type: "CryptoCurrency",
  id: "monad",
  coinType: 60,
  name: "Monad",
  managerAppName: "Ethereum",
  ticker: "MON",
  scheme: "monad",
  color: "#836EF9",
  family: "evm",
  units: [
    {
      name: "MON",
      code: "MON",
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
    chainId: 143,
  },
  explorerViews: [
    {
      tx: "https://monadexplorer.com/tx/$hash",
      address: "https://monadexplorer.com/address/$address",
    },
  ],
});
