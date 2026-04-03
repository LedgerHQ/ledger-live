import { currency } from "../define";

export const ton = currency({
  type: "CryptoCurrency",
  id: "ton",
  coinType: 607,
  name: "TON",
  managerAppName: "TON",
  ticker: "TON",
  scheme: "ton",
  color: "#0098ea",
  family: "ton",
  units: [
    {
      name: "TON",
      code: "TON",
      magnitude: 9,
    },
  ],
  explorerViews: [
    {
      tx: "https://tonscan.org/tx/$hash",
      address: "https://tonscan.org/address/$address",
    },
  ],
  tokenTypes: ["jetton"],
});
