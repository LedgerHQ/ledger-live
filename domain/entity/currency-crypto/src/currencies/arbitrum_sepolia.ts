import { currency } from "../define";

export const arbitrum_sepolia = currency({
  type: "CryptoCurrency",
  id: "arbitrum_sepolia",
  coinType: 60,
  name: "Arbitrum Sepolia",
  managerAppName: "Ethereum",
  ticker: "ETH",
  deviceTicker: "ETH",
  scheme: "arbitrum_sepolia",
  color: "#ff0000",
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
  isTestnetFor: "arbitrum",
  disableCountervalue: true,
  ethereumLikeInfo: {
    chainId: 421614,
  },
  explorerViews: [
    {
      tx: "https://arbitrum-sepolia.blockscout.com/tx/$hash",
      address: "https://arbitrum-sepolia.blockscout.com/address/$address",
      token:
        "https://arbitrum-sepolia.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
