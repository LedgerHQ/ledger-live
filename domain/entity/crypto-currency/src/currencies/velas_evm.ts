import { currency } from "../define";

export const velas_evm = currency({
  type: "CryptoCurrency",
  id: "velas_evm",
  coinType: 60,
  name: "Velas EVM",
  managerAppName: "Ethereum",
  ticker: "VLX",
  scheme: "velas",
  color: "#000000",
  family: "evm",
  units: [
    {
      name: "VLX",
      code: "VLX",
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
    chainId: 106,
  },
  explorerViews: [
    {
      tx: "https://evmexplorer.velas.com/tx/$hash",
      address: "https://evmexplorer.velas.com/address/$address",
      token:
        "https://evmexplorer.velas.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
