import { currency } from "../define";

export const monad_testnet = currency({
  type: "CryptoCurrency",
  id: "monad_testnet",
  coinType: 60,
  name: "Monad Testnet",
  managerAppName: "Ethereum",
  ticker: "MON",
  scheme: "monad_testnet",
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
    chainId: 10143,
  },
  explorerViews: [
    {
      tx: "https://testnet.monadexplorer.com/tx/$hash",
      address: "https://testnet.monadexplorer.com/address/$address",
    },
  ],
});
