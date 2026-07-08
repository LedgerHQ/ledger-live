import { currency } from "../define";

export const defi_oracle_meta = currency({
  type: "CryptoCurrency",
  id: "defi_oracle_meta",
  coinType: 60,
  name: "DeFi Oracle Meta Mainnet",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "defi-oracle-meta",
  color: "#627EEA",
  family: "evm",
  ethereumLikeInfo: {
    chainId: 138,
  },
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
  explorerViews: [
    {
      tx: "https://blockscout.defi-oracle.io/tx/$hash",
      address: "https://blockscout.defi-oracle.io/address/$address",
      token:
        "https://blockscout.defi-oracle.io/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
  keywords: ["defi oracle meta", "chain 138", "chain138"],
  tokenTypes: ["erc20"],
});
