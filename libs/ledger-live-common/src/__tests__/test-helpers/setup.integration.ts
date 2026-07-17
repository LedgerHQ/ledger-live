import BigNumber from "bignumber.js";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import "./environment";

// wallet-framework-test-setup (in setupFilesAfterEnv) already wired CurrenciesResolver.
// Override the CryptoAssetsStore with the real CAL RTK store for integration tests.
const calStore = setupCalClientStore();
setCryptoAssetsStore(calStore);

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass ? () => `${value} is a BigNumber` : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});
