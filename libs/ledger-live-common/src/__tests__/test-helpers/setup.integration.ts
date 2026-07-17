import BigNumber from "bignumber.js";
import { buildStandaloneCryptoAssetsStore } from "@features/platform-currencies";
import { setCryptoAssetsStore as setGlobalCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getEnv } from "@ledgerhq/live-env";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import "./environment";

// wallet-framework-test-setup (in setupFilesAfterEnv) already wired CurrenciesResolver.
// Override the CryptoAssetsStore with the real CAL RTK store for integration tests.
const calStore = buildStandaloneCryptoAssetsStore({
  calServiceUrl: getEnv("CAL_SERVICE_URL"),
  ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
});
setGlobalCryptoAssetsStore(calStore);
setCryptoAssetsStore(calStore);

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass ? () => `${value} is a BigNumber` : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});
