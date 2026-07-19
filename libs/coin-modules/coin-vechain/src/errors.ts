export class NotEnoughVTHO extends Error {
  override name = "NotEnoughVTHO";
  constructor(message?: string) {
    super(message ?? "NotEnoughVTHO");
  }
}
export class MustBeVechain extends Error {
  override name = "MustBeVechain";
  constructor(message?: string) {
    super(message ?? "MustBeVechain");
  }
}
export class ImpossibleToCalculateAmountAndFees extends Error {
  override name = "ImpossibleToCalculateAmountAndFees";
  constructor(message?: string) {
    super(message ?? "ImpossibleToCalculateAmountAndFees");
  }
}
