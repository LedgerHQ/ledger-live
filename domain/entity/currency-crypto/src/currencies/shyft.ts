import { currency } from "../define";

export const shyft = currency({
  type: "CryptoCurrency",
  id: "shyft",
  coinType: 7341,
  name: "Shyft",
  managerAppName: "Shyft",
  ticker: "SHFT",
  scheme: "shfyt",
  color: "#662c5e",
  family: "shyft",
  blockAvgTime: 5,
  units: [
    {
      name: "SHFT",
      code: "SHFT",
      magnitude: 18,
    },
  ],
  explorerViews: [
    {
      tx: "https://bx.shyft.network/tx/$hash",
      address: "https://bx.shyft.network/address/$address",
    },
  ],
});
