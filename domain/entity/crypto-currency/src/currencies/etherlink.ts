import { currency } from "../define";

export const etherlink = currency({
  type: "CryptoCurrency",
  id: "etherlink",
  coinType: 60,
  name: "Etherlink",
  managerAppName: "Ethereum",
  ticker: "XTZ",
  scheme: "etherlink",
  color: "#38FF9C",
  family: "evm",
  units: [
    {
      name: "XTZ",
      code: "XTZ",
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
    chainId: 42793,
  },
  explorerViews: [
    {
      tx: "https://explorer.etherlink.com/tx/$hash",
      address: "https://explorer.etherlink.com/address/$address",
      token:
        "https://explorer.etherlink.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
