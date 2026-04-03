import { currency } from "../define";

export const westend = currency({
  type: "CryptoCurrency",
  id: "westend",
  coinType: 354,
  name: "Westend",
  managerAppName: "Polkadot",
  ticker: "WND",
  deviceTicker: "DOT",
  scheme: "westend",
  color: "#00ff00",
  units: [
    {
      code: "WND",
      name: "WND",
      magnitude: 12,
    },
  ],
  isTestnetFor: "polkadot",
  family: "polkadot",
  explorerViews: [
    {
      address: "https://westend.subscan.io/account/$address",
      tx: "https://westend.subscan.io/extrinsic/$hash",
    },
  ],
});
