import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { CryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/type";
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
  findTokenById: (_: string) => undefined,
  findTokenByAddressInCurrency: (_: string, __: string) => undefined,
} as unknown as CryptoAssetsStore);
