import { currency } from "../define";

export const sui_testnet = currency({
  type: "CryptoCurrency",
  id: "sui_testnet",
  coinType: 784,
  name: "Sui (Testnet)",
  managerAppName: "Sui",
  ticker: "SUI",
  scheme: "sui_testnet",
  color: "#000",
  family: "sui",
  isTestnetFor: "sui",
  disableCountervalue: true,
  units: [
    {
      name: "Sui",
      code: "SUI",
      magnitude: 9,
    },
  ],
  explorerViews: [
    {
      tx: "https://suiscan.xyz/testnet/tx/$hash",
      address: "https://suiscan.xyz/testnet/account/$address",
    },
    {
      tx: "https://testnet.suivision.xyz/txblock/$hash",
      address: "https://testnet.suivision.xyz/account/$address",
    },
  ],
  tokenTypes: ["coin"],
});
