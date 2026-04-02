import { currency } from "../define";

export const polkadot = currency({
  type: "CryptoCurrency",
  id: "polkadot",
  coinType: 354,
  name: "Polkadot",
  managerAppName: "Polkadot",
  ticker: "DOT",
  scheme: "polkadot",
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
      address: "https://polkadot.subscan.io/account/$address",
      tx: "https://polkadot.subscan.io/extrinsic/$hash",
    },
    {
      address: "https://polkascan.io/polkadot/account/$address",
      tx: "https://polkascan.io/polkadot/transaction/$hash",
    },
  ],
  keywords: ["dot", "polkadot"],
});
