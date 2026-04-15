import { currency } from "../define";

export const assethub_polkadot = currency({
  type: "CryptoCurrency",
  id: "assethub_polkadot",
  coinType: 354,
  name: "Polkadot",
  managerAppName: "Polkadot",
  ticker: "DOT",
  deviceTicker: "DOT",
  scheme: "assethub_polkadot",
  color: "#E6007A",
  family: "polkadot",
  units: [
    {
      name: "DOT",
      code: "DOT",
      magnitude: 10,
    },
    {
      name: "planck",
      code: "PLANCK",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      address: "https://assethub-polkadot.subscan.io/account/$address",
      tx: "https://assethub-polkadot.subscan.io/extrinsic/$hash",
    },
  ],
  keywords: ["assethub"],
});
