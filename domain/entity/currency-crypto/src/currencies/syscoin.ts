import { currency } from "../define";

export const syscoin = currency({
  type: "CryptoCurrency",
  id: "syscoin",
  coinType: 60,
  name: "Syscoin",
  managerAppName: "Ethereum",
  ticker: "SYS",
  scheme: "syscoin",
  color: "#257DB8",
  family: "evm",
  units: [
    {
      name: "SYS",
      code: "SYS",
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
    chainId: 57,
  },
  explorerViews: [
    {
      tx: "https://explorer.syscoin.org/tx/$hash",
      address: "https://explorer.syscoin.org/address/$address",
      token:
        "https://explorer.syscoin.org/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
