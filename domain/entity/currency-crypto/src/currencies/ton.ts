import { currency } from "../define";

export const ton = currency({
  type: "CryptoCurrency",
  id: "ton",
  coinType: 607,
  name: "Gram",
  managerAppName: "TON",
  ticker: "GRAM",
  scheme: "ton",
  color: "#0098ea",
  family: "ton",
  units: [
    {
      name: "GRAM",
      code: "GRAM",
      magnitude: 9,
    },
  ],
  explorerViews: [
    {
      tx: "https://gramscan.org/tx/$hash",
      address: "https://gramscan.org/address/$address",
    },
  ],
  tokenTypes: ["jetton"],
});
