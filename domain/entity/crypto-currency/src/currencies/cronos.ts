import { currency } from "../define";

export const cronos = currency({
  type: "CryptoCurrency",
  id: "cronos",
  coinType: 60,
  name: "Cronos",
  managerAppName: "Ethereum",
  ticker: "CRO",
  scheme: "cro",
  color: "#002D74",
  family: "evm",
  ethereumLikeInfo: {
    chainId: 25,
  },
  units: [
    {
      name: "CRO",
      code: "CRO",
      magnitude: 18,
    },
  ],
  explorerViews: [
    {
      tx: "https://cronos.org/explorer/tx/$hash",
      address: "https://cronos.org/explorer/address/$address",
      token:
        "https://cronos.org/explorer/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
