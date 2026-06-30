import { BigNumber } from "bignumber.js";
import { getMainAccount } from "../../../../account/index";
import type { FlowEffect } from "../../../../bridge/descriptor/types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickRepresentativeFee(option: unknown): BigNumber | null {
  if (!isPlainObject(option)) return null;
  if (BigNumber.isBigNumber(option.maxFeePerGas)) return option.maxFeePerGas;
  if (BigNumber.isBigNumber(option.gasPrice)) return option.gasPrice;
  return null;
}

/**
 * `gasOptions` are considered usable only when slow/medium/fast hold distinct
 * fee rates. A transient "all-equal" snapshot from the fee provider would
 * otherwise overwrite a previously valid set, forcing the UI to maintain a
 * "last valid" cache. Surfacing only distinct values keeps the transaction
 * authoritative and lets the UI consume it as-is.
 */
function hasDistinctGasOptions(gasOptions: unknown): boolean {
  if (!isPlainObject(gasOptions)) return false;
  const fees = ["slow", "medium", "fast"]
    .map(key => pickRepresentativeFee(gasOptions[key]))
    .filter((value): value is BigNumber => value !== null);
  if (fees.length < 2) return false;
  const [first, ...rest] = fees;
  return rest.some(value => !value.isEqualTo(first));
}

/**
 * Syncs EVM fee presets (`gasOptions`) onto the current transaction by reading them from
 * `bridge.prepareTransaction` and returning an opaque patch for the flow runner.
 * Skips the patch when the new presets are missing or not distinct so we never
 * downgrade an already valid set.
 * See: https://ledgerhq.atlassian.net/browse/LIVE-31764
 */
export const syncGasOptionsEffect: FlowEffect = {
  id: "syncGasOptions",
  run: async ({ account, parentAccount, transaction, bridge }) => {
    const mainAccount = getMainAccount(account, parentAccount ?? undefined);
    const prepared = await bridge.prepareTransaction(mainAccount, transaction);
    const gasOptions = "gasOptions" in prepared ? prepared.gasOptions : undefined;
    if (!hasDistinctGasOptions(gasOptions)) return null;
    return { gasOptions };
  },
};
