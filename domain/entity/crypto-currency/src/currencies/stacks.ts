import { currency } from "../define";

export const stacks = currency({
  type: "CryptoCurrency",
  id: "stacks",
  coinType: 5757,
  name: "Stacks",
  managerAppName: "Stacks",
  ticker: "STX",
  scheme: "stacks",
  color: "#5546ff",
  family: "stacks",
  units: [
    {
      name: "STX",
      code: "STX",
      magnitude: 6,
    },
    {
      name: "uSTX",
      code: "uSTX",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.stacks.co/txid/$hash",
      address: "https://explorer.stacks.co/address/$address",
    },
  ],
  tokenTypes: ["sip010"],
});
