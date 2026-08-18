import BigNumber from "bignumber.js";
import { buildStandaloneCryptoAssetsStore } from "@features/platform-currencies/legacy";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import "./environment";

// wallet-framework-test-setup (in setupFilesAfterEnv) already wired CurrenciesResolver.
// Override the CryptoAssetsStore with the real CAL RTK store for integration tests.
setCryptoAssetsStore(
  buildStandaloneCryptoAssetsStore({
    calServiceUrl: process.env.CAL_SERVICE_URL ?? "https://global.api.prd.ledger.com/cal",
    ledgerClientVersion: process.env.LEDGER_CLIENT_VERSION || "live-common-integration-test",
  }),
);

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass ? () => `${value} is a BigNumber` : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});
