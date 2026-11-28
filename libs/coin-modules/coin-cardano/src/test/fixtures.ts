import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";

export const ACCOUNT_KEYS = [
  {
    addressHex:
      "00bea94629d5cf776b8374a00afa15686f0b0742dd0330f86804c61202b5de20d8ec4cd8ca0ba6183589fec7a09896b7643d2176b8a447ac36",
    publicKeyHex: "806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ce",
    chainCodeHex: "b3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d",
  },
  {
    addressHex:
      "0009457d98f405191765830c1afe91cc32b5f45c193a9aad4b606f8f5dd599d97135c125c5633d3d4431be87a9cff26ec08d388833bfcc530f",
    publicKeyHex: "ed5e0d059cb2eed53ea30b9ba84bb3aaa6c2364c6305a0c9a7e8944aa439884a",
    chainCodeHex: "642cc2f06e601808926e14b6e27417be0b0323d5a5149f1eebab8fc4e1fe14d4",
  },
];

export const POLICY_ID = "a".repeat(56);
export const ASSET_NAME = "b0b1";

export const TOKEN = {
  type: "TokenCurrency",
  id: `cardano_testnet/native/${POLICY_ID}${ASSET_NAME}`,
  contractAddress: `${POLICY_ID}${ASSET_NAME}`,
  parentCurrencyId: "cardano_testnet",
  tokenType: "native",
  name: "Test native token",
  ticker: "TNT",
  units: [{ name: "TNT", code: "TNT", magnitude: 0 }],
} as unknown as TokenCurrency;
