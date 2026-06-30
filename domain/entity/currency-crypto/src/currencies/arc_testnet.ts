import { currency } from "../define";

export const arc_testnet = currency({
  type: "CryptoCurrency",
  id: "arc_testnet",
  coinType: 60,
  name: "Arc Testnet",
  managerAppName: "Ethereum",
  ticker: "USDC",
  deviceTicker: "USDC",
  scheme: "arc_testnet",
  color: "#6B7280",
  family: "evm",
  units: [
    {
      name: "USDC",
      code: "USDC",
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
  ethereumLikeInfo: {
    chainId: 5042002,
  },
  explorerViews: [
    {
      tx: "https://testnet.arcscan.app/tx/$hash",
      address: "https://testnet.arcscan.app/address/$address",
      token: "https://testnet.arcscan.app/token/$contractAddress?a=$address",
    },
  ],
});
