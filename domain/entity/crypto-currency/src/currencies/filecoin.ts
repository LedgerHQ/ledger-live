import { currency } from "../define";

export const filecoin = currency({
  type: "CryptoCurrency",
  id: "filecoin",
  coinType: 461,
  name: "Filecoin",
  managerAppName: "Filecoin",
  ticker: "FIL",
  scheme: "filecoin",
  color: "#0090ff",
  family: "filecoin",
  units: [
    {
      name: "FIL",
      code: "FIL",
      magnitude: 18,
    },
  ],
  explorerViews: [
    {
      tx: "https://beryx.io/v1/explore/fil/mainnet/transactions/$hash",
      address: "https://beryx.io/v1/explore/fil/mainnet/address/$address",
    },
  ],
  tokenTypes: ["erc20"],
});
