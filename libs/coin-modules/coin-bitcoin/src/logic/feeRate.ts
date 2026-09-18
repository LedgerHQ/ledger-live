import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import type { Account as WalletBtcAccount } from "@ledgerhq/wallet-btc/account";

/**
 * A user-provided fee-rate override (sat/vByte), read from a `FeeEstimation`'s `parameters`.
 *
 * Bitcoin fees are rate-based, so the knob the user controls is a sat/vB rate (the legacy bridge's
 * `feePerByte`), carried in `parameters.feePerByte` — NOT `FeeEstimation.value`, which is the total
 * fee the framework subtracts from the balance (see `validateIntent`). Returns `undefined` when
 * absent or not a positive number, so callers fall back to the network-estimated rate.
 */
export function feePerByteOverride(parameters?: FeeEstimation["parameters"]): number | undefined {
  const raw = parameters?.feePerByte;
  const value = typeof raw === "string" ? Number(raw) : raw;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.max(1, Math.ceil(value));
  }
  return undefined;
}

/**
 * Resolve a sat/vB fee rate from the explorer.
 *
 * `getFees` returns sat/kvB per confirmation target, e.g.
 * `{ "2": 2435, "3": 1241, "6": 1009, last_updated: ... }`. Convert to sat/vB (÷1000, 1 sat/vB
 * floor) and take the middle ("normal") target.
 */
export async function resolveFeePerByte(account: WalletBtcAccount): Promise<number> {
  const rawFees = await account.xpub.explorer.getFees();
  const rates = Object.entries(rawFees)
    .filter(([key]) => !Number.isNaN(Number(key)))
    .map(([, value]) => value)
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value))
    .map(value => Math.max(1, Math.ceil(value / 1000)));
  if (rates.length === 0) return 1;
  return rates[Math.floor(rates.length / 2)];
}
