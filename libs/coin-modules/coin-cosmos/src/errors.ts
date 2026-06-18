export class CosmosRedelegationInProgress extends Error {
  override name = "CosmosRedelegationInProgress";
  constructor(message = "CosmosRedelegationInProgress") {
    super(message);
  }
}
export class CosmosDelegateAllFundsWarning extends Error {
  override name = "CosmosDelegateAllFundsWarning";
  constructor(message = "CosmosDelegateAllFundsWarning") {
    super(message);
  }
}
export class CosmosTooManyValidators extends Error {
  override name = "CosmosTooManyValidators";
  constructor(message = "CosmosTooManyValidators") {
    super(message);
  }
}
export class NotEnoughDelegationBalance extends Error {
  override name = "NotEnoughDelegationBalance";
  constructor(message = "NotEnoughDelegationBalance") {
    super(message);
  }
}
export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message = "ClaimRewardsFeesWarning") {
    super(message);
  }
}
export class CosmosTooManyRedelegations extends Error {
  override name = "CosmosTooManyRedelegations";
  constructor(message = "CosmosTooManyRedelegations") {
    super(message);
  }
}
