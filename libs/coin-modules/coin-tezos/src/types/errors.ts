import { createCustomErrorClass } from "@ledgerhq/errors";
import { LedgerErrorConstructor } from "@ledgerhq/errors/helpers";

export const InvalidAddressBecauseAlreadyDelegated = createCustomErrorClass(
  "InvalidAddressBecauseAlreadyDelegated",
);
export const UnsupportedTransactionMode = createCustomErrorClass<
  { mode: string },
  LedgerErrorConstructor<{ mode: string }>
>("UnsupportedTransactionMode");
export const UnsupportedOperationKind = createCustomErrorClass<
  { kind: string },
  LedgerErrorConstructor<{ kind: string }>
>("UnsupportedOperationKind");
export const MustDelegateBeforeStaking = createCustomErrorClass("MustDelegateBeforeStaking");
export const TezosNotEnoughStaked = createCustomErrorClass("TezosNotEnoughStaked");

// Staking with a new delegate is rejected by the protocol while an unfinalizable unstake request
// to the previous delegate still exists (~4-day freeze). Surfaced during stake fee estimation.
// Display is i18n-driven (via error.name); the message is a fallback for logs.
export class TezosStakeBlockedByPendingUnstake extends Error {
  constructor() {
    super(
      "Cannot stake with the new validator while an unfinalizable unstake to the previous one is pending",
    );
    this.name = "TezosStakeBlockedByPendingUnstake";
  }
}
