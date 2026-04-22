import { currency } from "../define";

export const ellaism = currency({
  type: "CryptoCurrency",
  id: "ellaism",
  coinType: 163,
  name: "Ellaism",
  managerAppName: "Ellaism",
  ticker: "ELLA",
  scheme: "ellaism",
  color: "#000000",
  family: "evm",
  units: [
    {
      name: "ELLA",
      code: "ELLA",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
