import { currency } from "../define";

export const polygon_zk_evm_testnet = currency({
  type: "CryptoCurrency",
  id: "polygon_zk_evm_testnet",
  coinType: 60,
  name: "Polygon zkEVM Testnet",
  managerAppName: "Ethereum",
  ticker: "ETH",
  deviceTicker: "ETH",
  scheme: "polygon_zk_evm_testnet",
  color: "#E58247",
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
  disableCountervalue: true,
  isTestnetFor: "polygon_zk_evm",
  ethereumLikeInfo: {
    chainId: 1442,
  },
  explorerViews: [
    {
      tx: "https://explorer-ui.cardona.zkevm-rpc.com/tx/$hash",
      address: "https://explorer-ui.cardona.zkevm-rpc.com/address/$address",
      token:
        "https://explorer-ui.cardona.zkevm-rpc.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
