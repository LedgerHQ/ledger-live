import { currency } from "../define";

export const avalanche_c_chain_fuji = currency({
  type: "CryptoCurrency",
  id: "avalanche_c_chain_fuji",
  coinType: 60,
  name: "Avalanche C-Chain Fuji",
  managerAppName: "Ethereum",
  ticker: "AVAX",
  scheme: "avalanche_c_chain_fuji",
  color: "#E84142",
  family: "evm",
  units: [
    {
      name: "AVAX",
      code: "AVAX",
      magnitude: 18,
    },
  ],
  isTestnetFor: "avalanche_c_chain",
  ethereumLikeInfo: {
    chainId: 43113,
  },
  explorerViews: [
    {
      tx: "https://testnet.snowtrace.io/tx/$hash",
      address: "https://testnet.snowtrace.io/address/$address",
      token: "https://testnet.snowtrace.io/token/$contractAddress?a=$address",
    },
  ],
});
