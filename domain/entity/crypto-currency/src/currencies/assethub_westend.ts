import { currency } from "../define";

export const assethub_westend = currency({
  type: "CryptoCurrency",
  id: "assethub_westend",
  coinType: 354,
  name: "Assethub Westend",
  managerAppName: "Polkadot",
  ticker: "WND",
  deviceTicker: "DOT",
  scheme: "assethub_westend",
  color: "#00ff00",
  units: [
    {
      code: "WND",
      name: "WND",
      magnitude: 12,
    },
  ],
  family: "polkadot",
  explorerViews: [
    {
      address: "https://assethub-westend.subscan.io/account/$address",
      tx: "https://assethub-westend.subscan.io/extrinsic/$hash",
    },
  ],
});
