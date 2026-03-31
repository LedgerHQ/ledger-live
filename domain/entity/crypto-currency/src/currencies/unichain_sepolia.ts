import { currency } from "../define";

export const unichain_sepolia = currency({
  type: "CryptoCurrency",
  id: "unichain_sepolia",
  coinType: 60,
  name: "Unichain Sepolia",
  managerAppName: "Ethereum",
  ticker: "ETH",
  deviceTicker: "ETH",
  scheme: "unichain_sepolia",
  color: "#f50fb4",
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
  isTestnetFor: "unichain",
  disableCountervalue: true,
  ethereumLikeInfo: {
    chainId: 1301,
  },
  explorerViews: [
    {
      tx: "https://sepolia.uniscan.xyz/tx/$hash",
      address: "https://sepolia.uniscan.xyz/address/$address",
      token:
        "https://sepolia.uniscan.xyz/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
