export class PolkadotUnauthorizedOperation extends Error {
  override name = "PolkadotUnauthorizedOperation";
  constructor(message = "PolkadotUnauthorizedOperation") {
    super(message);
  }
}
export class PolkadotElectionClosed extends Error {
  override name = "PolkadotElectionClosed";
  constructor(message = "PolkadotElectionClosed") {
    super(message);
  }
}
export class PolkadotNotValidator extends Error {
  override name = "PolkadotNotValidator";
  constructor(message = "PolkadotNotValidator", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class PolkadotLowBondedBalance extends Error {
  override name = "PolkadotLowBondedBalance";
  constructor(message = "PolkadotLowBondedBalance") {
    super(message);
  }
}
export class PolkadotNoUnlockedBalance extends Error {
  override name = "PolkadotNoUnlockedBalance";
  constructor(message = "PolkadotNoUnlockedBalance") {
    super(message);
  }
}
export class PolkadotNoNominations extends Error {
  override name = "PolkadotNoNominations";
  constructor(message = "PolkadotNoNominations") {
    super(message);
  }
}
export class PolkadotAllFundsWarning extends Error {
  override name = "PolkadotAllFundsWarning";
  constructor(message = "PolkadotAllFundsWarning") {
    super(message);
  }
}
export class PolkadotBondMinimumAmount extends Error {
  override name = "PolkadotBondMinimumAmount";
  constructor(message = "PolkadotBondMinimumAmount", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotBondMinimumAmountWarning extends Error {
  override name = "PolkadotBondMinimumAmountWarning";
  constructor(message = "PolkadotBondMinimumAmountWarning", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotMaxUnbonding extends Error {
  override name = "PolkadotMaxUnbonding";
  constructor(message = "PolkadotMaxUnbonding") {
    super(message);
  }
}
export class PolkadotValidatorsRequired extends Error {
  override name = "PolkadotValidatorsRequired";
  constructor(message = "PolkadotValidatorsRequired") {
    super(message);
  }
}
