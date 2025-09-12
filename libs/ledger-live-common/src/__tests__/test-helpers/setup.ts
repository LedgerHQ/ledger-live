import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import "./environment";
import BigNumber from "bignumber.js";

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass ? () => `${value} is a BigNumber` : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework({
  findTokenById: async (_: string) => undefined,
  findTokenByAddressInCurrency: async (_: string, __: string) => undefined,
  findTokenByAddress: async (_: string) => undefined,
  getTokenById: async (_: string) => {
    throw new Error("Token not found");
  },
  findTokenByTicker: async (_: string) => undefined,
} as CryptoAssetsStore);
