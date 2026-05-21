import { currency } from "../define";

export const sei_evm = currency({
  type: "CryptoCurrency",
  id: "sei_evm",
  coinType: 60,
  name: "SEI Network (EVM)",
  managerAppName: "Sei",
  ticker: "SEI",
  scheme: "sei",
  color: "#89395b",
  family: "evm",
  units: [
    {
      name: "SEI",
      code: "SEI",
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
    chainId: 1329,
  },
  explorerViews: [
    {
      tx: "https://seistream.app/transactions/$hash",
      address: "https://seistream.app/account/$address",
      token: "https://seistream.app/tokens/$address",
    },
  ],
});
