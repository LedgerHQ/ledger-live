import type { Balance } from "@ledgerhq/coin-module-framework/api/index";

/**
 * CoinModuleApi-level getBalance. Unlike the AccountBridge sync path (see
 * logic/sync.ts + logic/balance.ts, which compose the transparent + shielded
 * total for an already-synced account), the headless CoinModuleApi surface
 * has no synced account/UTXO-set to read from for a bare address -- Zcash
 * balance is only meaningful once an account has gone through
 * AccountBridge.sync. Reports zero rather than fabricate a value.
 */
export async function getBalance(_address: string): Promise<Balance[]> {
  return [{ value: 0n, asset: { type: "native" } }];
}
