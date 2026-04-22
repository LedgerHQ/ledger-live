import { currency } from "../define";

export const crypto_org_croeseid = currency({
  type: "CryptoCurrency",
  id: "crypto_org_croeseid",
  coinType: 394,
  name: "Cronos POS Chain Croeseid",
  managerAppName: "Cronos POS Chain Croeseid",
  ticker: "CRO",
  scheme: "crypto_org_croeseid",
  color: "#0e1c37",
  family: "cosmos",
  units: [
    {
      name: "TCRO",
      code: "tcro",
      magnitude: 8,
    },
    {
      name: "baseTCRO",
      code: "basetcro",
      magnitude: 0,
    },
  ],
  isTestnetFor: "crypto_org",
  disableCountervalue: true,
  explorerViews: [
    {
      tx: "https://cronos-pos.org/explorer/croeseid/tx/$hash",
      address: "https://cronos-pos.org/explorer/croeseid/account/$address",
    },
  ],
});
