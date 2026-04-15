import { currency } from "../define";

export const eos = currency({
  type: "CryptoCurrency",
  id: "eos",
  coinType: 194,
  name: "EOS",
  managerAppName: "Eos",
  ticker: "EOS",
  scheme: "eos",
  color: "#000000",
  family: "eos",
  units: [
    {
      name: "EOS",
      code: "EOS",
      magnitude: 2,
    },
  ],
  explorerViews: [],
});
