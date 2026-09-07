import { currency } from "../define";

export const gonka = currency({
  type: "CryptoCurrency",
  id: "gonka",
  coinType: 1200,
  name: "Gonka",
  managerAppName: "Cosmos",
  ticker: "GNK",
  scheme: "gonka",
  color: "#242424",
  family: "cosmos",
  units: [
    {
      name: "GNK",
      code: "GNK",
      magnitude: 9,
    },
    {
      name: "ngonka",
      code: "ngonka",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://gonka.hyperfusion.io/dashboard/gonka/tx/$hash",
      address: "https://gonka.hyperfusion.io/dashboard/gonka/account/$address",
    },
  ],
});
