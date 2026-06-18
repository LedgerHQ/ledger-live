export class InvalidAddressBecauseAlreadyDelegated extends Error {
  override name = "InvalidAddressBecauseAlreadyDelegated";
  constructor(message = "InvalidAddressBecauseAlreadyDelegated") {
    super(message);
  }
}
export class UnsupportedTransactionMode extends Error {
  override name = "UnsupportedTransactionMode";
  declare mode: string;
  constructor(message = "UnsupportedTransactionMode", fields?: { mode: string }) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class UnsupportedOperationKind extends Error {
  override name = "UnsupportedOperationKind";
  declare kind: string;
  constructor(message = "UnsupportedOperationKind", fields?: { kind: string }) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class MustDelegateBeforeStaking extends Error {
  override name = "MustDelegateBeforeStaking";
  constructor(message = "MustDelegateBeforeStaking") {
    super(message);
  }
}
export class TezosNotEnoughStaked extends Error {
  override name = "TezosNotEnoughStaked";
  constructor(message = "TezosNotEnoughStaked") {
    super(message);
  }
}
