import { currency } from "../define";

export const robinhood_testnet = currency({
  type: "CryptoCurrency",
  id: "robinhood_testnet",
  coinType: 60,
  name: "Robinhood Chain Testnet",
  managerAppName: "Ethereum",
  ticker: "ETH",
  deviceTicker: "ETH",
  scheme: "robinhood_testnet",
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
  disableCountervalue: true,
  isTestnetFor: "robinhood",
  ethereumLikeInfo: {
    chainId: 46630,
  },
  explorerViews: [
    {
      tx: "https://explorer.testnet.chain.robinhood.com/tx/$hash",
      address: "https://explorer.testnet.chain.robinhood.com/address/$address",
      token:
        "https://explorer.testnet.chain.robinhood.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
