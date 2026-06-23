import { currency } from "../define";

export const robinhood = currency({
  type: "CryptoCurrency",
  id: "robinhood",
  coinType: 60,
  name: "Robinhood Chain",
  managerAppName: "Ethereum",
  ticker: "ETH",
  deviceTicker: "ETH",
  scheme: "robinhood",
  color: "#00C805",
  family: "evm",
  units: [
    {
      name: "ether",
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
  ethereumLikeInfo: {
    chainId: 4663,
  },
  explorerViews: [
    {
      tx: "https://explorer.chain.robinhood.com/tx/$hash",
      address: "https://explorer.chain.robinhood.com/address/$address",
      token:
        "https://explorer.chain.robinhood.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
