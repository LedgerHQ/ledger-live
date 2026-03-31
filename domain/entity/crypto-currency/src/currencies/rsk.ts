import { currency } from "../define";

export const rsk = currency({
  type: "CryptoCurrency",
  id: "rsk",
  coinType: 60,
  name: "Rootstock",
  managerAppName: "Ethereum",
  ticker: "RBTC",
  scheme: "rsk",
  color: "#FF931E",
  family: "evm",
  units: [
    {
      name: "RBTC",
      code: "RBTC",
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
    chainId: 30,
  },
  explorerViews: [
    {
      tx: "https://rootstock.blockscout.com/tx/$hash",
      address: "https://rootstock.blockscout.com/address/$address",
      token:
        "https://rootstock.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
