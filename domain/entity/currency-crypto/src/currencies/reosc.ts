import { currency } from "../define";

export const reosc = currency({
  type: "CryptoCurrency",
  id: "reosc",
  coinType: 2894,
  name: "REOSC",
  managerAppName: "REOSC",
  ticker: "REOSC",
  scheme: "reosc",
  color: "#0E00FF",
  family: "evm",
  units: [
    {
      name: "REOSC",
      code: "REOSC",
      magnitude: 16,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.reosc.io/tx/$hash",
      address: "https://explorer.reosc.io/addr/$address",
    },
  ],
});
