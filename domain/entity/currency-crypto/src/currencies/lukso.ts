import { currency } from "../define";

export const lukso = currency({
  type: "CryptoCurrency",
  id: "lukso",
  coinType: 60,
  name: "Lukso",
  managerAppName: "Ethereum",
  ticker: "LYX",
  scheme: "lukso",
  color: "#FE0167",
  family: "evm",
  units: [
    {
      name: "LYX",
      code: "LYX",
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
  disableCountervalue: false,
  ethereumLikeInfo: {
    chainId: 42,
  },
  explorerViews: [
    {
      tx: "https://explorer.execution.mainnet.lukso.network/tx/$hash",
      address: "https://explorer.execution.mainnet.lukso.network/address/$address",
      token:
        "https://explorer.execution.mainnet.lukso.network/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
