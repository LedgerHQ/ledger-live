import { currency } from "../define";

export const musicoin = currency({
  type: "CryptoCurrency",
  id: "musicoin",
  coinType: 184,
  name: "Musicoin",
  managerAppName: "Musicoin",
  ticker: "MUSIC",
  scheme: "musicoin",
  color: "#000000",
  family: "evm",
  units: [
    {
      name: "MUSIC",
      code: "MUSIC",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
