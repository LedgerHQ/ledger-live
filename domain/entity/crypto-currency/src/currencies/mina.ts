import { currency } from "../define";

export const mina = currency({
  type: "CryptoCurrency",
  id: "mina",
  coinType: 12586,
  name: "Mina",
  managerAppName: "Mina",
  ticker: "MINA",
  scheme: "mina",
  color: "#e1effa",
  family: "mina",
  units: [
    {
      name: "MINA",
      code: "MINA",
      magnitude: 9,
    },
  ],
  explorerViews: [
    {
      tx: "https://minascan.io/mainnet/tx/$hash/txInfo",
      address: "https://minascan.io/mainnet/account/$address",
    },
  ],
});
