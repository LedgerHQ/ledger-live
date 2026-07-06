import { currency } from "../define";

export const bittensor = currency({
  type: "CryptoCurrency",
  id: "bittensor",
  // Intentionally uses Polkadot's coin type (354), not Bittensor's SLIP-0044 slot (1005):
  // Bittensor reuses the Polkadot app, which derives at 354 and applies the SS58 prefix (42)
  // dynamically. Kept in sync with @ledgerhq/cryptoassets (dual-maintained). Do not revert to 1005.
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
