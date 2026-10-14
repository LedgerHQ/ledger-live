export class StacksMemoTooLong extends Error {
  override name = "StacksMemoTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "StacksMemoTooLong");
    if (fields) Object.assign(this, fields);
  }
}

/** pox-5 rejects `stake` during the prepare phase (`ERR_STAKE_IN_PREPARE_PHASE`). Carries
 * `blocksUntilReopen`, the burn blocks left until the next reward phase opens staking again. */
export class StacksStakeInPreparePhase extends Error {
  override name = "StacksStakeInPreparePhase";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "StacksStakeInPreparePhase");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidNonce extends Error {
  override name = "InvalidNonce";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidNonce");
    if (fields) Object.assign(this, fields);
  }
}
