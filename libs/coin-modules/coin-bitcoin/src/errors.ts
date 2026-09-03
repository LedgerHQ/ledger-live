// AccountNeedResync, RbfBuildError, and InvalidXpub live in @ledgerhq/wallet-btc;
// re-exported here so consumers don't need to depend on wallet-btc directly.
export { AccountNeedResync, RbfBuildError, InvalidXpub } from "@ledgerhq/wallet-btc/errors";

export class TaprootNotActivated extends Error {
  override name = "TaprootNotActivated";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TaprootNotActivated");
    if (fields) Object.assign(this, fields);
  }
}

export class BitcoinInfrastructureError extends Error {
  override name = "InfrastructureError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InfrastructureError");
    if (fields) Object.assign(this, fields);
  }
}

export class FeeTooLow extends Error {
  override name = "FeeTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FeeTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class DustLimit extends Error {
  override name = "DustLimit";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "DustLimit");
    if (fields) Object.assign(this, fields);
  }
}

export class OpReturnDataSizeLimit extends Error {
  override name = "OpReturnDataSizeLimit";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "OpReturnDataSizeLimit");
    if (fields) Object.assign(this, fields);
  }
}
