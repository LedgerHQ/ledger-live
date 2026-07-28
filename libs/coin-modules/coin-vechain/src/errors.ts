export class NotEnoughVTHO extends Error {
  override name = "NotEnoughVTHO";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughVTHO");
    if (fields) Object.assign(this, fields);
  }
}

export class MustBeVechain extends Error {
  override name = "MustBeVechain";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MustBeVechain");
    if (fields) Object.assign(this, fields);
  }
}

export class ImpossibleToCalculateAmountAndFees extends Error {
  override name = "ImpossibleToCalculateAmountAndFees";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ImpossibleToCalculateAmountAndFees");
    if (fields) Object.assign(this, fields);
  }
}
