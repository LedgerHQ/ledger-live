import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import "./environment";
import BigNumber from "bignumber.js";

// Unit tests use mock store
setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass ? () => `${value} is a BigNumber` : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});
