import { currency } from "../define";

export const helium = currency({
  type: "CryptoCurrency",
  id: "helium",
  coinType: 904,
  name: "Helium",
  managerAppName: "Helium",
  ticker: "HNT",
  scheme: "helium",
  color: "#474DFF",
  family: "helium",
  units: [
    {
      name: "HNT",
      code: "HNT",
      magnitude: 8,
    },
    {
      name: "bones",
      code: "bones",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.helium.com/txns/$hash",
      address: "https://explorer.helium.com/accounts/$address",
    },
  ],
});
