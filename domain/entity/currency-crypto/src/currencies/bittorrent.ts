import { currency } from "../define";

export const bittorrent = currency({
  type: "CryptoCurrency",
  id: "bittorrent",
  coinType: 60,
  name: "Bittorent Chain",
  managerAppName: "Ethereum",
  ticker: "BTT",
  scheme: "btt",
  color: "#000000",
  family: "evm",
  units: [
    {
      name: "BTT",
      code: "BTT",
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
    chainId: 199,
  },
  explorerViews: [
    {
      tx: "https://bttcscan.com/tx/$hash",
      address: "https://bttcscan.com/address/$address",
      token: "https://bttcscan.com/token/$address",
    },
  ],
});
