export class NotEnoughVTHO extends Error {
  override name = "NotEnoughVTHO";
  constructor(message = "NotEnoughVTHO") {
    super(message);
  }
}
export class MustBeVechain extends Error {
  override name = "MustBeVechain";
  constructor(message = "MustBeVechain") {
    super(message);
  }
}
export class ImpossibleToCalculateAmountAndFees extends Error {
  override name = "ImpossibleToCalculateAmountAndFees";
  constructor(message = "ImpossibleToCalculateAmountAndFees") {
    super(message);
  }
}
