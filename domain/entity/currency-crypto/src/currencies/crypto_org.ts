import { currency } from "../define";

export const crypto_org = currency({
  type: "CryptoCurrency",
  id: "crypto_org",
  coinType: 394,
  name: "Cronos POS Chain",
  managerAppName: "Cronos POS Chain",
  ticker: "CRO",
  scheme: "crypto_org",
  color: "#0e1c37",
  keywords: ["cro", "cronos pos chain"],
  family: "cosmos",
  units: [
    {
      name: "CRO",
      code: "CRO",
      magnitude: 8,
    },
    {
      name: "basecro",
      code: "basecro",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/crypto-org/tx/$hash",
      address: "https://www.mintscan.io/crypto-org/validators/$address",
    },
  ],
});
