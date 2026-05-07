import "../../__tests__/test-helpers/setup.integration";
import cosmosCoinConfig, { type CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import { CosmosAPI } from "@ledgerhq/coin-cosmos/network/Cosmos";
import { getCurrencyConfiguration } from "../../config";
import { cosmosConfig } from "./config";

/**
 * Wire the coin config so that CosmosAPI's internal cryptoFactory picks up the
 * LCD endpoint from cosmosConfig (via LiveConfig) instead of relying on the
 * hardcoded chain-class defaults.
 *
 * Install the override only for this test suite and restore the previous
 * getter afterwards so it does not leak into other tests sharing the same
 * Jest process. `getCoinConfig()` accepts an optional currencyId, so delegate
 * to the previous getter when it is called without one.
 */
const previousGetCoinConfig = cosmosCoinConfig.getCoinConfig.bind(cosmosCoinConfig);

beforeAll(() => {
  cosmosCoinConfig.setCoinConfig(currencyId => {
    if (!currencyId) {
      return previousGetCoinConfig(currencyId);
    }

    return getCurrencyConfiguration<CosmosCoinConfig>(currencyId);
  });
});

afterAll(() => {
  cosmosCoinConfig.setCoinConfig(previousGetCoinConfig);
});

/**
 * Currency IDs are derived by stripping the `config_currency_` prefix from
 * each key in cosmosConfig (e.g. `config_currency_cosmos` → `cosmos`).
 * Every Cosmos chain has an LCD endpoint, so no additional filtering is needed.
 */
const CURRENCY_IDS = Object.keys(cosmosConfig).map(key => key.replace(/^config_currency_/, ""));

describe.each(CURRENCY_IDS)("getHeight on %s", currencyId => {
  it("returns a positive block height", async () => {
    const api = new CosmosAPI(currencyId);
    const height = await api.getHeight();

    expect(height).toBeGreaterThan(0);
  });
});
