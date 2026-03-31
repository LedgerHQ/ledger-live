import { currency } from "../define";

export const ether1 = currency({
  type: "CryptoCurrency",
  id: "ether1",
  coinType: 61,
  name: "Ether1",
  managerAppName: "Ether-1",
  ticker: "ETHO",
  scheme: "ether1",
  color: "#000000",
  units: [
    {
      name: "ETHO",
      code: "ETHO",
      magnitude: 18,
    },
    {
      name: "Gwei",
      code: "Gwei",
      magnitude: 9,
    },
    {
      name: "Mwei",
      code: "Mwei",
      magnitude: 6,
    },
    {
      name: "Kwei",
      code: "Kwei",
      magnitude: 3,
    },
    {
      name: "wei",
      code: "wei",
      magnitude: 0,
    },
  ],
  family: "evm",
  blockAvgTime: 15,
  explorerViews: [],
});
