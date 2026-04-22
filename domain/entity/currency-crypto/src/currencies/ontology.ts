import { currency } from "../define";

export const ontology = currency({
  type: "CryptoCurrency",
  id: "ontology",
  coinType: 1024,
  name: "Ontology",
  managerAppName: "ONT",
  ticker: "ONT",
  scheme: "ontology",
  color: "#00A6C2",
  family: "ontology",
  units: [
    {
      name: "ONT",
      code: "ONT",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.ont.io/transaction/$hash",
    },
  ],
});
