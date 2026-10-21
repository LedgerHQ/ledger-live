import { setupServer } from "msw/node";
import coinConfig, { cosmosConfig, CosmosCoinConfig } from "../config";
import { CosmosAPI } from "../network/Cosmos";

// Ledger LCD proxies. MSW handlers register these exact hosts; the values only need to match what
// `makeTestApi` configures the api with.
export const TEST_COSMOS_ENDPOINT = "https://cosmoshub4.coin.ledger.com";
export const TEST_BABYLON_ENDPOINT = "https://babylon.coin.ledger.com";

export const server = setupServer();

/**
 * The coin config for `currencyId` (name, unit and base denom from the served defaults), with its
 * LCD pointed at `endpoint`.
 */
export function makeTestConfig(currencyId: string, endpoint: string): CosmosCoinConfig {
  const defaults = cosmosConfig[`config_currency_${currencyId}`].default as CosmosCoinConfig;
  return {
    ...defaults,
    lcd: endpoint,
    minGasPrice: 0.025,
    status: { type: "active" },
  };
}

/**
 * Point BOTH cosmos endpoint-resolution paths at `endpoint`: the `coinConfig` path (estimateFees →
 * getEstimatedFees) and the `CosmosAPI`-instance path (getBalance/getStakes/… take the returned api).
 * `version` defaults to v1beta1, so MSW handler URLs use `/v1beta1/`.
 */
export function makeTestApi(currencyId: string, endpoint: string): CosmosAPI {
  const config = makeTestConfig(currencyId, endpoint);
  coinConfig.setCoinConfig(() => config);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors network/Cosmos.integ.test.ts
  return new CosmosAPI(currencyId, { endpoint } as any);
}
