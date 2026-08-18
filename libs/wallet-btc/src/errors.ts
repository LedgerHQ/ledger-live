// wallet-btc domain errors. Re-exported by @ledgerhq/coin-bitcoin for
// backward compatibility (see coin-bitcoin/src/errors.ts).
export class AccountNeedResync extends Error {
  override name = "AccountNeedResync";
  constructor(message?: string) {
    super(message || "AccountNeedResync");
  }
}

export class RbfBuildError extends Error {
  override name = "RbfBuildError";
  constructor(message?: string) {
    super(message || "RbfBuildError");
  }
}

export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
  constructor(message?: string) {
    super(message || "UnsupportedDerivation");
  }
}

export class InvalidAddress extends Error {
  override name = "InvalidAddress";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidAddress");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalance extends Error {
  override name = "NotEnoughBalance";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughBalance");
    if (fields) Object.assign(this, fields);
  }
}
