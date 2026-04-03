import { currency } from "../define";

export const ethergem = currency({
  type: "CryptoCurrency",
  id: "ethergem",
  coinType: 61,
  name: "EtherGem",
  managerAppName: "EtherGem",
  ticker: "EGEM",
  scheme: "ethergem",
  color: "#000000",
  units: [
    {
      name: "EGEM",
      code: "EGEM",
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
