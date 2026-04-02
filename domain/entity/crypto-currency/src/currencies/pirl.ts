import { currency } from "../define";

export const pirl = currency({
  type: "CryptoCurrency",
  id: "pirl",
  coinType: 164,
  name: "Pirl",
  managerAppName: "Pirl",
  ticker: "PIRL",
  scheme: "pirl",
  color: "#A2D729",
  family: "evm",
  units: [
    {
      name: "PIRL",
      code: "PIRL",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://poseidon.pirl.io/explorer/transaction/$hash",
    },
  ],
});
