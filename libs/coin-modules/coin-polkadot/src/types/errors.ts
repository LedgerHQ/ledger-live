export class PolkadotUnauthorizedOperation extends Error {
  override name = "PolkadotUnauthorizedOperation";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotUnauthorizedOperation");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotElectionClosed extends Error {
  override name = "PolkadotElectionClosed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotElectionClosed");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotNotValidator extends Error {
  override name = "PolkadotNotValidator";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotNotValidator");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotLowBondedBalance extends Error {
  override name = "PolkadotLowBondedBalance";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotLowBondedBalance");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotNoUnlockedBalance extends Error {
  override name = "PolkadotNoUnlockedBalance";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotNoUnlockedBalance");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotNoNominations extends Error {
  override name = "PolkadotNoNominations";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotNoNominations");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotAllFundsWarning extends Error {
  override name = "PolkadotAllFundsWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotAllFundsWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotBondMinimumAmount extends Error {
  override name = "PolkadotBondMinimumAmount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotBondMinimumAmount");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotBondMinimumAmountWarning extends Error {
  override name = "PolkadotBondMinimumAmountWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotBondMinimumAmountWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotMaxUnbonding extends Error {
  override name = "PolkadotMaxUnbonding";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotMaxUnbonding");
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotValidatorsRequired extends Error {
  override name = "PolkadotValidatorsRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PolkadotValidatorsRequired");
    if (fields) Object.assign(this, fields);
  }
}
