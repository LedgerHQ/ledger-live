import { currency } from "../define";

export const polygon_zk_evm = currency({
  type: "CryptoCurrency",
  id: "polygon_zk_evm",
  coinType: 60,
  name: "Polygon zkEVM",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "polygon_zk_evm",
  color: "#8247E5",
  family: "evm",
  units: [
    {
      name: "ETH",
      code: "ETH",
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
    chainId: 1101,
  },
  explorerViews: [
    {
      tx: "https://zkevm.blockscout.com/tx/$hash",
      address: "https://zkevm.blockscout.com/address/$address",
      token:
        "https://zkevm.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
