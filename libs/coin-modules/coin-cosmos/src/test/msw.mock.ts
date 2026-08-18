import { setupServer } from "msw/node";
import coinConfig, { CosmosCoinConfig } from "../config";
import { CosmosAPI } from "../network/Cosmos";
import type { CosmosCurrencyConfig } from "../types";

// Ledger LCD proxies. MSW handlers register these exact hosts; the values only need to match what
// `makeTestApi` configures the api with.
export const TEST_COSMOS_ENDPOINT = "https://cosmoshub4.coin.ledger.com";
export const TEST_BABYLON_ENDPOINT = "https://babylon.coin.ledger.com";

export const server = setupServer();

/**
 * Point BOTH cosmos endpoint-resolution paths at `endpoint`: the `coinConfig` path (estimateFees →
 * getEstimatedFees) and the `CosmosAPI`-instance path (getBalance/getStakes/… take the returned api).
 * `version` defaults to v1beta1, so MSW handler URLs use `/v1beta1/`.
 */
export function makeTestApi(currencyId: string, endpoint: string): CosmosAPI {
  // Flat runtime shape (CosmosCurrencyConfig + status); the declared CosmosCoinConfig wraps every
  // field in ConfigInfo (LiveConfig's stored shape), so cast through unknown — mirrors coin-tester-cosmos.
  const config = {
    lcd: endpoint,
    minGasPrice: 0.025,
    status: { type: "active" as const },
  } satisfies CosmosCurrencyConfig & { status: { type: "active" } };
  coinConfig.setCoinConfig(() => config as unknown as CosmosCoinConfig);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors network/Cosmos.integ.test.ts
  return new CosmosAPI(currencyId, { endpoint } as any);
}
