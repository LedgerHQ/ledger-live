import { currency } from "../define";

export const particl = currency({
  type: "CryptoCurrency",
  id: "particl",
  coinType: 44,
  name: "Particl",
  managerAppName: "Particl",
  ticker: "PART",
  scheme: "particl",
  color: "#00E3A4",
  family: "particl",
  units: [
    {
      name: "PART",
      code: "PART",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.particl.io/tx/$hash",
    },
  ],
});
