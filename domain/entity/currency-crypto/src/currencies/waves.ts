import { currency } from "../define";

export const waves = currency({
  type: "CryptoCurrency",
  id: "waves",
  coinType: 5741564,
  name: "Waves",
  managerAppName: "Waves",
  ticker: "WAVES",
  scheme: "waves",
  color: "#004FFF",
  family: "waves",
  units: [
    {
      name: "WAVES",
      code: "WAVES",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
