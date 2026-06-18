export class AccountNeedResync extends Error {
  override name = "AccountNeedResync";
  constructor(message = "AccountNeedResync") {
    super(message);
  }
}

export class TaprootNotActivated extends Error {
  override name = "TaprootNotActivated";
  constructor(message = "TaprootNotActivated") {
    super(message);
  }
}

export class BitcoinInfrastructureError extends Error {
  override name = "InfrastructureError";
  constructor(message = "InfrastructureError") {
    super(message);
  }
}
