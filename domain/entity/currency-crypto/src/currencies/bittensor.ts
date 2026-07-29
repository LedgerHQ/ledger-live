import { currency } from "../define";

export const bittensor = currency({
  type: "CryptoCurrency",
  id: "bittensor",
  // Polkadot coin type (354), not the SLIP-0044 1005 slot: Bittensor reuses the Polkadot app.
  coinType: 354,
  name: "Bittensor",
  managerAppName: "Polkadot",
  ticker: "TAO",
  scheme: "bittensor",
  color: "#252525",
  family: "polkadot",
  units: [
    {
      name: "TAO",
      code: "TAO",
      magnitude: 9,
    },
    {
      name: "RAO",
      code: "RAO",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      address: "https://taostats.io/account/$address",
      tx: "https://taostats.io/extrinsic/$hash",
    },
  ],
  keywords: ["tao", "bittensor"],
});
