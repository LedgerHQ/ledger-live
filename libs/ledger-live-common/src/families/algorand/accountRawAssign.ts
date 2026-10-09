import type { OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import genericAccountRawAssign from "../../bridge/generic-coin-framework/accountRawAssign";

// Unknown keys are spread through: `getAccountShape` also revives `details.familyExtra` alone.
function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  const raw = extraRaw as Record<string, unknown>;
  return typeof raw.rewards === "string" ? { ...raw, rewards: new BigNumber(raw.rewards) } : raw;
}

function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  const value = extra as Record<string, unknown>;
  return BigNumber.isBigNumber(value.rewards)
    ? { ...value, rewards: value.rewards.toFixed() }
    : value;
}

export default {
  ...genericAccountRawAssign,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
