import "../../__tests__/test-helpers/setup.integration";
import { createApi } from "@ledgerhq/coin-evm/api/index";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { destroyAllRpcProviders } from "@ledgerhq/coin-evm/network/node/rpc.common";
import { getCurrencyConfiguration } from "../../config";
import { evmConfig } from "./config";
/**
 * Build the list of currency IDs that have a node configured.
 * Chains without a node entry (akroma, atheios, callisto…) have no
 * reachable RPC and are intentionally excluded.
 *
 * Currency ID is derived by stripping the `config_currency_` prefix from
 * the config key (e.g. `config_currency_base` → `base`).
 */
const CURRENCY_IDS: string[] = Object.entries(evmConfig).flatMap(([key, entry]) => {
  if (entry.type !== "object" || !entry.default["node"]) return [];
  return [key.replace(/^config_currency_/, "")];
});

afterAll(() => {
  destroyAllRpcProviders();
});

describe.each(CURRENCY_IDS)("lastBlock on %s", currencyId => {
  let module: ReturnType<typeof createApi>;

  beforeAll(() => {
    const config = getCurrencyConfiguration<EvmConfigInfo>(currencyId);
    module = createApi(config, currencyId);
  });

  it("returns a valid last block", async () => {
    const result = await module.lastBlock();

    expect(result.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time.getTime()).toBeLessThanOrEqual(Date.now() + 60_000);
  });
});
