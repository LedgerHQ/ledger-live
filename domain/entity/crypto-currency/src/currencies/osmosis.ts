import { currency } from "../define";

export const osmosis = currency({
  type: "CryptoCurrency",
  id: "osmo",
  coinType: 118,
  name: "Osmosis",
  managerAppName: "Cosmos",
  ticker: "OSMO",
  scheme: "osmo",
  color: "#493c9b",
  family: "cosmos",
  units: [
    {
      name: "Osmosis",
      code: "OSMO",
      magnitude: 6,
    },
    {
      name: "Micro-OSMO",
      code: "uosmo",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/osmosis/txs/$hash",
      address: "https://www.mintscan.io/osmosis/validators/$address",
    },
  ],
});
