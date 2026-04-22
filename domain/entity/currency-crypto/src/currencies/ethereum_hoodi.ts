import { currency } from "../define";

export const ethereum_hoodi = currency({
  type: "CryptoCurrency",
  id: "ethereum_hoodi",
  coinType: 60,
  name: "Ethereum Hoodi",
  managerAppName: "Ethereum",
  ticker: "ETH",
  deviceTicker: "ETH",
  scheme: "eth_hoodi",
  color: "#0ebdcd",
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
  isTestnetFor: "ethereum",
  disableCountervalue: true,
  family: "evm",
  blockAvgTime: 15,
  ethereumLikeInfo: {
    chainId: 560048,
  },
  explorerViews: [
    {
      tx: "https://hoodi.etherscan.io/tx/$hash",
      address: "https://hoodi.etherscan.io/address/$address",
    },
  ],
  explorerId: "eth_hoodi",
});
