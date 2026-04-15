import { currency } from "../define";

export const sui = currency({
  type: "CryptoCurrency",
  id: "sui",
  coinType: 784,
  name: "Sui",
  managerAppName: "Sui",
  ticker: "SUI",
  scheme: "sui",
  color: "#000",
  family: "sui",
  units: [
    {
      name: "Sui",
      code: "SUI",
      magnitude: 9,
    },
  ],
  explorerViews: [
    {
      tx: "https://suiscan.xyz/mainnet/tx/$hash",
      address: "https://suiscan.xyz/mainnet/account/$address",
    },
    {
      tx: "https://suivision.xyz/txblock/$hash",
      address: "https://suivision.xyz/account/$address",
    },
  ],
  tokenTypes: ["sui"],
});
