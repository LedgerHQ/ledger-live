import type { OperationType } from "@ledgerhq/types-live";

const INCOMING_TYPES = new Set<OperationType>(["IN", "REVEAL", "REWARD_PAYOUT"]);

export function isIncomingType(type: OperationType): boolean {
  return INCOMING_TYPES.has(type);
}
