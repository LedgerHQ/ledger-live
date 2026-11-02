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

/** The stake form's pool is not a `<address>.<contract name>` contract principal. */
export class StacksInvalidPoolAddress extends Error {
  override name = "StacksInvalidPoolAddress";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "StacksInvalidPoolAddress");
    if (fields) Object.assign(this, fields);
  }
}

/** The stake form's number of cycles is not a whole number within pox-5's 1-96 bound. */
export class StacksInvalidNumCycles extends Error {
  override name = "StacksInvalidNumCycles";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "StacksInvalidNumCycles");
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
