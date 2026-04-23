import { currency } from "../define";

export const adi = currency({
  type: "CryptoCurrency",
  id: "adi",
  coinType: 60,
  name: "Adi",
  managerAppName: "Ethereum",
  ticker: "ADI",
  scheme: "adi",
  color: "#0066CC",
  family: "evm",
  units: [
    {
      name: "ADI",
      code: "ADI",
      magnitude: 18,
    },
  ],
  ethereumLikeInfo: {
    chainId: 36900,
  },
  explorerViews: [
    {
      tx: "https://explorer.adifoundation.ai/tx/$hash",
      address: "https://explorer.adifoundation.ai/address/$address",
      token:
        "https://explorer.adifoundation.ai/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
  keywords: ["adi", "adi chain"],
  tokenTypes: ["erc20"],
});
