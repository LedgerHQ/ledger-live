export class PolkadotUnauthorizedOperation extends Error {
  override name = "PolkadotUnauthorizedOperation";
}
export class PolkadotElectionClosed extends Error {
  override name = "PolkadotElectionClosed";
}
export class PolkadotNotValidator extends Error {
  override name = "PolkadotNotValidator";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class PolkadotLowBondedBalance extends Error {
  override name = "PolkadotLowBondedBalance";
}
export class PolkadotNoUnlockedBalance extends Error {
  override name = "PolkadotNoUnlockedBalance";
}
export class PolkadotNoNominations extends Error {
  override name = "PolkadotNoNominations";
}
export class PolkadotAllFundsWarning extends Error {
  override name = "PolkadotAllFundsWarning";
}
export class PolkadotBondMinimumAmount extends Error {
  override name = "PolkadotBondMinimumAmount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotBondMinimumAmountWarning extends Error {
  override name = "PolkadotBondMinimumAmountWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class PolkadotMaxUnbonding extends Error {
  override name = "PolkadotMaxUnbonding";
}
export class PolkadotValidatorsRequired extends Error {
  override name = "PolkadotValidatorsRequired";
}
