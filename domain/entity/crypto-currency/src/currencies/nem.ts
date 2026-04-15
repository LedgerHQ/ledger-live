import { currency } from "../define";

export const nem = currency({
  type: "CryptoCurrency",
  id: "nem",
  coinType: 43,
  name: "NEM",
  managerAppName: "NEM",
  ticker: "XEM",
  scheme: "nem",
  color: "#000",
  family: "nem",
  units: [
    {
      name: "XEM",
      code: "XEM",
      magnitude: 6,
    },
  ],
  explorerViews: [],
});
