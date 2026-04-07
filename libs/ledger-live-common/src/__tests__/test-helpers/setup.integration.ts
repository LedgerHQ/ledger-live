import { setupCalClientStore } from "../../test-helpers/cryptoAssetsStore";
import "./environment";
import BigNumber from "bignumber.js";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import { registerCoinModules } from "../../coin-modules/registry";

// Integration tests use the real CAL API
setupCalClientStore();

// Register all coin modules so getCurrencyBridge/getAccountBridge can load them dynamically
registerCoinModules(coinModuleLoaders);

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass ? () => `${value} is a BigNumber` : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});
