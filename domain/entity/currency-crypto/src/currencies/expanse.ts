import { currency } from "../define";

export const expanse = currency({
  type: "CryptoCurrency",
  id: "expanse",
  coinType: 40,
  name: "Expanse",
  managerAppName: "Expanse",
  ticker: "EXP",
  scheme: "expanse",
  color: "#EE4500",
  family: "evm",
  units: [
    {
      name: "EXP",
      code: "EXP",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://gander.tech/tx/$hash",
    },
  ],
});
