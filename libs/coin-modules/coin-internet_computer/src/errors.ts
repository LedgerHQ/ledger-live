/*
 * When the transferID/Memo is non number
 */
export class InvalidMemoICP extends Error {
  override name = "InvalidMemoICP";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidMemoICP");
    if (fields) Object.assign(this, fields);
  }
}

// Staking amount below the minimum neuron stake.
export class NotEnoughTransferAmount extends Error {
  override name = "NotEnoughTransferAmount";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughTransferAmount");
    if (fields) Object.assign(this, fields);
  }
}

// Requested dissolve delay below the network minimum (bounds passed as { minSeconds } at throw time).
export class ICPDissolveDelayLTMin extends Error {
  override name = "ICPDissolveDelayLTMin";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPDissolveDelayLTMin");
    if (fields) Object.assign(this, fields);
  }
}

// Requested dissolve delay above the network maximum (bounds passed as { maxSeconds } at throw time).
export class ICPDissolveDelayGTMax extends Error {
  override name = "ICPDissolveDelayGTMax";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPDissolveDelayGTMax");
    if (fields) Object.assign(this, fields);
  }
}

// Requested dissolve delay below the neuron's current delay (a neuron's delay can only increase).
export class ICPDissolveDelayLTCurrent extends Error {
  override name = "ICPDissolveDelayLTCurrent";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPDissolveDelayLTCurrent");
    if (fields) Object.assign(this, fields);
  }
}

// Referenced neuron is absent from the account's synced neuron set.
export class ICPNeuronNotFound extends Error {
  override name = "ICPNeuronNotFound";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPNeuronNotFound");
    if (fields) Object.assign(this, fields);
  }
}

// Hot key is not a valid principal.
export class ICPInvalidHotKey extends Error {
  override name = "ICPInvalidHotKey";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPInvalidHotKey");
    if (fields) Object.assign(this, fields);
  }
}

export class ICPHotKeyAlreadyExists extends Error {
  override name = "ICPHotKeyAlreadyExists";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPHotKeyAlreadyExists");
    if (fields) Object.assign(this, fields);
  }
}

// Split would leave less than the minimum stake on either resulting neuron.
export class ICPSplitNotAllowed extends Error {
  override name = "ICPSplitNotAllowed";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPSplitNotAllowed");
    if (fields) Object.assign(this, fields);
  }
}

// Top-up cannot auto-refresh: the neuron's stake nonce is not recoverable from this account's history.
export class ICPStakeMemoNotRecoverable extends Error {
  override name = "ICPStakeMemoNotRecoverable";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPStakeMemoNotRecoverable");
    if (fields) Object.assign(this, fields);
  }
}

// A governance call was submitted but no terminal status was observed; its outcome is unknown.
export class ICPCallUnconfirmed extends Error {
  override name = "ICPCallUnconfirmed";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPCallUnconfirmed");
    if (fields) Object.assign(this, fields);
  }
}

// Non-blocking notices surfaced on staking transactions.
export class ICPIncreaseStakeWarning extends Error {
  override name = "ICPIncreaseStakeWarning";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPIncreaseStakeWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class ICPCreateNeuronWarning extends Error {
  override name = "ICPCreateNeuronWarning";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPCreateNeuronWarning");
    if (fields) Object.assign(this, fields);
  }
}

// Spawn / stake-maturity percentage is outside the valid 1–100 integer range.
export class ICPInvalidPercentage extends Error {
  override name = "ICPInvalidPercentage";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPInvalidPercentage");
    if (fields) Object.assign(this, fields);
  }
}

// The governance canister ran the command and refused it. The call reached the network, so this is
// not a delivery failure — its `reason` field carries the canister's own text (empty if it gave none).
export class ICPGovernanceRejected extends Error {
  override name = "ICPGovernanceRejected";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPGovernanceRejected");
    if (fields) Object.assign(this, fields);
  }
}

// The replica rejected the ingress message, so the call never executed. Distinct from
// ICPGovernanceRejected: nothing ran, and from ICPCallUnconfirmed: the outcome is known.
export class ICPCallRejected extends Error {
  override name = "ICPCallRejected";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ICPCallRejected");
    if (fields) Object.assign(this, fields);
  }
}
