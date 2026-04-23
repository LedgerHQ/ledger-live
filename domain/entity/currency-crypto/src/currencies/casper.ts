import { currency } from "../define";

export const casper = currency({
  name: "Casper",
  ticker: "CSPR",
  coinType: 506,
  color: "#000000",
  family: "casper",
  id: "casper",
  managerAppName: "Casper",
  scheme: "casper",
  type: "CryptoCurrency",
  explorerViews: [
    {
      tx: "https://cspr.live/deploy/$hash",
      address: "https://cspr.live/account/$address",
    },
  ],
  units: [
    {
      name: "CSPR",
      code: "CSPR",
      magnitude: 9,
    },
    {
      name: "motes",
      code: "motes",
      magnitude: 0,
    },
  ],
});
