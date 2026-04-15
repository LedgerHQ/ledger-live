import { currency } from "../define";

export const nix = currency({
  type: "CryptoCurrency",
  id: "nix",
  coinType: 400,
  name: "Nix",
  managerAppName: "NIX",
  ticker: "NIX",
  scheme: "nix",
  color: "#344cff",
  supportsSegwit: true,
  family: "bitcoin",
  blockAvgTime: 120,
  bitcoinLikeInfo: {
    P2PKH: 38,
    P2SH: 53,
  },
  units: [
    {
      name: "nix",
      code: "NIX",
      magnitude: 8,
    },
    {
      name: "satoshi",
      code: "sat",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://blockchain.nixplatform.io/tx/$hash",
    },
  ],
});
