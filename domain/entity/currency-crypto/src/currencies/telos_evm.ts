import { currency } from "../define";

export const telos_evm = currency({
  type: "CryptoCurrency",
  id: "telos_evm",
  coinType: 60,
  name: "Telos",
  managerAppName: "Ethereum",
  ticker: "TLOS",
  scheme: "telos_evm",
  color: "#AC72F9",
  family: "evm",
  units: [
    {
      name: "TLOS",
      code: "TLOS",
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
    chainId: 40,
  },
  explorerViews: [
    {
      tx: "https://www.teloscan.io/tx/$hash",
      address: "https://www.teloscan.io/address/$address",
      token: "https://www.teloscan.io/token/$contractAddress?a=$address",
    },
  ],
});
