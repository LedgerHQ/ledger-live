import { currency } from "../define";

export const qrl = currency({
  type: "CryptoCurrency",
  id: "qrl",
  coinType: 238,
  name: "QRL",
  ticker: "QRL",
  managerAppName: "QRL",
  scheme: "qrl",
  color: "#1D2951",
  family: "qrl",
  blockAvgTime: 60,
  units: [
    {
      name: "QRL",
      code: "QRL",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.theqrl.org/tx/$hash",
      address: "https://explorer.theqrl.org/a/$address",
    },
  ],
});
