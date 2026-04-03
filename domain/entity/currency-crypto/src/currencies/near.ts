import { currency } from "../define";

export const near = currency({
  type: "CryptoCurrency",
  id: "near",
  coinType: 397,
  name: "NEAR",
  managerAppName: "NEAR",
  ticker: "NEAR",
  scheme: "near",
  color: "#000",
  family: "near",
  units: [
    {
      name: "NEAR",
      code: "NEAR",
      magnitude: 24,
    },
    {
      name: "yoctoNEAR",
      code: "yoctoNEAR",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      address: "https://nearblocks.io/address/$address",
      tx: "https://nearblocks.io/txns/$hash",
    },
  ],
  keywords: ["near"],
});
