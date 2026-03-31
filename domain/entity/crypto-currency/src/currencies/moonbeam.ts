import { currency } from "../define";

export const moonbeam = currency({
  type: "CryptoCurrency",
  id: "moonbeam",
  coinType: 60,
  name: "Moonbeam",
  managerAppName: "Ethereum",
  ticker: "GLMR",
  scheme: "moonbeam",
  color: "#958FDC",
  family: "evm",
  units: [
    {
      name: "GLMR",
      code: "GLMR",
      magnitude: 18,
    },
  ],
  ethereumLikeInfo: {
    chainId: 1284,
  },
  explorerViews: [
    {
      tx: "https://moonbeam.moonscan.io/tx/$hash",
      address: "https://moonbeam.moonscan.io/address/$address",
      token: "https://moonbeam.moonscan.io/token/$contractAddress?a=$address",
    },
  ],
});
