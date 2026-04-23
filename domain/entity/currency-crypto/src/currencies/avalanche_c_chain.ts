import { currency } from "../define";

export const avalanche_c_chain = currency({
  type: "CryptoCurrency",
  id: "avalanche_c_chain",
  coinType: 60,
  name: "Avalanche C-Chain",
  managerAppName: "Ethereum",
  ticker: "AVAX",
  scheme: "avalanche_c_chain",
  color: "#E84142",
  family: "evm",
  units: [
    {
      name: "AVAX",
      code: "AVAX",
      magnitude: 18,
    },
  ],
  ethereumLikeInfo: {
    chainId: 43114,
  },
  explorerViews: [
    {
      tx: "https://cchain.explorer.avax.network/tx/$hash",
      address: "https://cchain.explorer.avax.network/address/$address",
      token: "https://cchain.explorer.avax.network/token/$contractAddress?a=$address",
    },
  ],
  keywords: ["avax", "avalanche", "c-chain"],
  explorerId: "avax",
});
