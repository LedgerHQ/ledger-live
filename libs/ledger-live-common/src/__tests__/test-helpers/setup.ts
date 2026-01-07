import { setupMockCryptoAssetsStore } from "../../test-helpers/cryptoAssetsStore";
import "./environment";
import BigNumber from "bignumber.js";

// Unit tests use mock store
setupMockCryptoAssetsStore();

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass ? () => `${value} is a BigNumber` : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});
