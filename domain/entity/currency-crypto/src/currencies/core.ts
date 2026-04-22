import { currency } from "../define";

export const core = currency({
  type: "CryptoCurrency",
  id: "core",
  coinType: 60,
  name: "Core",
  managerAppName: "Ethereum",
  ticker: "CORE",
  scheme: "core",
  color: "#FF962B",
  family: "evm",
  units: [
    {
      name: "CORE",
      code: "CORE",
      magnitude: 18,
    },
    {
      name: "Gwei",
      code: "Gwei",
      magnitude: 9,
    },
    {
      name: "Mwei",
      code: "Mwei",
      magnitude: 6,
    },
    {
      name: "Kwei",
      code: "Kwei",
      magnitude: 3,
    },
    {
      name: "wei",
      code: "wei",
      magnitude: 0,
    },
  ],
  ethereumLikeInfo: {
    chainId: 1116,
  },
  explorerViews: [
    {
      tx: "https://scan.coredao.org/tx/$hash",
      address: "https://scan.coredao.org/address/$address",
      token: "https://scan.coredao.org/token/$address",
    },
  ],
  tokenTypes: ["erc20"],
});
