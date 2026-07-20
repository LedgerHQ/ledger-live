export class InvalidAddressBecauseAlreadyDelegated extends Error {
  override name = "InvalidAddressBecauseAlreadyDelegated";
  constructor(message?: string) {
    super(message || "InvalidAddressBecauseAlreadyDelegated");
  }
}
export class UnsupportedTransactionMode extends Error {
  override name = "UnsupportedTransactionMode";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnsupportedTransactionMode");
    if (fields) Object.assign(this, fields);
  }
}
export class UnsupportedOperationKind extends Error {
  override name = "UnsupportedOperationKind";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnsupportedOperationKind");
    if (fields) Object.assign(this, fields);
  }
}
export class MustDelegateBeforeStaking extends Error {
  override name = "MustDelegateBeforeStaking";
  constructor(message?: string) {
    super(message || "MustDelegateBeforeStaking");
  }
}
export class TezosNotEnoughStaked extends Error {
  override name = "TezosNotEnoughStaked";
  constructor(message?: string) {
    super(message || "TezosNotEnoughStaked");
  }
}

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
