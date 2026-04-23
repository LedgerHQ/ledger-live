import { currency } from "../define";

export const neon_evm = currency({
  type: "CryptoCurrency",
  id: "neon_evm",
  coinType: 60,
  name: "Neon EVM",
  managerAppName: "Ethereum",
  ticker: "NEON",
  scheme: "neon_evm",
  color: "#D13BB7",
  family: "evm",
  units: [
    {
      name: "NEON",
      code: "NEON",
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
    chainId: 245022934,
  },
  explorerViews: [
    {
      tx: "https://neon.blockscout.com/tx/$hash",
      address: "https://neon.blockscout.com/address/$address",
      token:
        "https://neon.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
