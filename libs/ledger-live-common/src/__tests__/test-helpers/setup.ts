import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/tokens";
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

// Use legacyCryptoAssetsStore for integration tests so tokens can be found
setCryptoAssetsStoreForCoinFramework(legacyCryptoAssetsStore);
