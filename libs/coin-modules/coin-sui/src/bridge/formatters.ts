import { OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import type { SuiOperationExtra, SuiOperationExtraRaw } from "../types";

/**
 * Round-trip Sui operation extras through the bridge's persisted `Record<string, string>` form.
 * `transferAmount` (BigNumber) is intentionally not persisted — it lives on optimistic ops only and
 * is rebuilt on the next sync. `validatorAddress`/`stakedAmount` (the staking fields the drawer
 * renders) must survive disk persistence, so they are.
 */
export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): SuiOperationExtra {
  if (!extraRaw) return {};
  const raw = extraRaw as SuiOperationExtraRaw;
  const extra: SuiOperationExtra = {};
  if (raw.coinType) extra.coinType = raw.coinType;
  if (raw.validatorAddress) extra.validatorAddress = raw.validatorAddress;
  if (raw.stakedAmount) extra.stakedAmount = raw.stakedAmount;
  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra): SuiOperationExtraRaw {
  if (!extra) return {};
  const e = extra as SuiOperationExtra;
  const raw: SuiOperationExtraRaw = {};
  if (e.coinType) raw.coinType = e.coinType;
  if (e.validatorAddress) raw.validatorAddress = e.validatorAddress;
  if (e.stakedAmount) raw.stakedAmount = e.stakedAmount;
  return raw;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
