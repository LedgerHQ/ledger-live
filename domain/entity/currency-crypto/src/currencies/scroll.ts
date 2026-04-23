import { currency } from "../define";

export const scroll = currency({
  type: "CryptoCurrency",
  id: "scroll",
  coinType: 60,
  name: "Scroll",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "scroll",
  color: "#ebc28e",
  family: "evm",
  units: [
    {
      name: "ETH",
      code: "ETH",
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
    chainId: 534352,
  },
  explorerViews: [
    {
      tx: "https://scroll.blockscout.com/tx/$hash",
      address: "https://scroll.blockscout.com/address/$address",
      token:
        "https://scroll.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
