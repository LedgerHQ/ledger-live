import { currency } from "../define";

export const celo = currency({
  type: "CryptoCurrency",
  id: "celo",
  coinType: 52752,
  name: "Celo",
  managerAppName: "Celo",
  blockAvgTime: 5,
  ticker: "CELO",
  scheme: "celo",
  color: "#35D07F",
  family: "celo",
  units: [
    {
      name: "CELO",
      code: "CELO",
      magnitude: 18,
    },
  ],
  ethereumLikeInfo: {
    chainId: 42220,
  },
  explorerViews: [
    {
      tx: "https://explorer.celo.org/tx/$hash",
      address: "https://explorer.celo.org/address/$address",
    },
  ],
  tokenTypes: ["erc20"],
});
