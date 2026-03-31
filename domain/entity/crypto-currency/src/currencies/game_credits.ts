import { currency } from "../define";

export const game_credits = currency({
  type: "CryptoCurrency",
  id: "game_credits",
  coinType: 101,
  name: "GameCredits",
  managerAppName: "GameCredits",
  ticker: "GAME",
  scheme: "game",
  color: "#24485D",
  family: "bitcoin",
  units: [
    {
      name: "GAME",
      code: "GAME",
      magnitude: 8,
    },
  ],
  bitcoinLikeInfo: {
    P2PKH: 38,
    P2SH: 62,
  },
  explorerViews: [],
});
