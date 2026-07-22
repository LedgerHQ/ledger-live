import type {
  ListOperationsOptions,
  Operation as ApiOperation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";

/**
 * CoinModuleApi-level listOperations. The AccountBridge path (see
 * logic/sync.ts) is the source of truth for Zcash operation history --
 * transparent operations come from wallet-btc's explorer, shielded
 * operations come from the zcash-utils shielded scan (see logic/operations.ts
 * `convertShieldedTransactionsToOperations`). A bare address has no
 * associated viewing key at this layer, so the headless surface returns an
 * empty page rather than guessing.
 */
export async function listOperations(
  _address: string,
  _options: ListOperationsOptions,
): Promise<Page<ApiOperation>> {
  return { items: [] };
}
