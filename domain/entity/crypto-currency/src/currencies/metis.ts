import { currency } from "../define";

export const metis = currency({
  type: "CryptoCurrency",
  id: "metis",
  coinType: 60,
  name: "Metis",
  managerAppName: "Ethereum",
  ticker: "METIS",
  scheme: "metis",
  color: "#00DACC",
  family: "evm",
  units: [
    {
      name: "METIS",
      code: "METIS",
      magnitude: 18,
    },
    {
      name: "Gwei",
      code: "Gwei",
      magnitude: 9,
    },
    {
      name: "Mwei",
      code: "Mwei",
      magnitude: 6,
    },
    {
      name: "Kwei",
      code: "Kwei",
      magnitude: 3,
    },
    {
      name: "wei",
      code: "wei",
      magnitude: 0,
    },
  ],
  ethereumLikeInfo: {
    chainId: 1088,
  },
  explorerViews: [
    {
      tx: "https://andromeda-explorer.metis.io/tx/$hash",
      address: "https://andromeda-explorer.metis.io/address/$address",
      token:
        "https://andromeda-explorer.metis.io/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
