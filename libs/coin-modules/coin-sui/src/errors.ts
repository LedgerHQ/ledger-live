/*
 * One SUI is minimal to stake.
 */
export class OneSuiMinForStake extends Error {
  override name = "OneSuiMinForStake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "OneSuiMinForStake");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * One SUI is minimal for partial unstake.
 */
export class OneSuiMinForUnstake extends Error {
  override name = "OneSuiMinForUnstake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "OneSuiMinForUnstake");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * One SUI is minimal to be left when partial unstake.
 */
export class OneSuiMinForUnstakeToBeLeft extends Error {
  override name = "OneSuiMinForUnstakeToBeLeft";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "OneSuiMinForUnstakeToBeLeft");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * At least 0.1 SUI to unstake
 */
export class SomeSuiForUnstake extends Error {
  override name = "SomeSuiForUnstake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SomeSuiForUnstake");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * The staking position a partial unstake refers to is absent from the account's synced stakes, so
 * its principal — and therefore the legality of the split — cannot be established locally.
 */
export class SuiStakeNotFound extends Error {
  override name = "SuiStakeNotFound";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SuiStakeNotFound");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * A partial unstake asks for more than the staking position holds. `staking_pool::split` asserts
 * `split_amount <= principal` (`EInsufficientSuiTokenBalance`), so the chain aborts the withdrawal.
 */
export class SuiUnstakeExceedsStake extends Error {
  override name = "SuiUnstakeExceedsStake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SuiUnstakeExceedsStake");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * The installed Sui app rejected a transfer drawn from the SIP-58 address balance because it
 * doesn't recognize the `0x2::coin::redeem_funds` withdrawal. Older apps return an opaque
 * UNKNOWN_ERROR (0x8); we raise this instead so the user knows to update the Sui app.
 */
export class SuiAddressBalanceAppUpdateRequired extends Error {
  override name = "SuiAddressBalanceAppUpdateRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(
      message ||
        "Your Ledger Sui app can't sign a transfer from your SUI address balance. Update the Sui app on your Ledger device and try again.",
    );
    if (fields) Object.assign(this, fields);
  }
}
