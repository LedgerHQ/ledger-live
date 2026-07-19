/** Cardano error thrown when transaction amount is less then minUtxo */
export class CardanoMinAmountError extends Error {
  override name = "CardanoMinAmountError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoMinAmountError");
    if (fields) Object.assign(this, fields);
  }
}

/** Cardano error thrown when user don't have enough fund for deposit */
export class CardanoStakeKeyDepositError extends Error {
  override name = "CardanoStakeKeyDepositError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoStakeKeyDepositError");
    if (fields) Object.assign(this, fields);
  }
}

/** Cardano error thrown when not enough funds to perform transaction */
export class CardanoNotEnoughFunds extends Error {
  override name = "CardanoNotEnoughFunds";
  constructor(message?: string) {
    super(message || "CardanoNotEnoughFunds");
  }
}

export class CardanoInvalidPoolId extends Error {
  override name = "CardanoInvalidPoolId";
  constructor(message?: string) {
    super(message || "CardanoInvalidPoolId");
  }
}

/** Cardano warning/error for high fees */
export class CardanoFeeHigh extends Error {
  override name = "CardanoFeeHigh";
  constructor(message?: string) {
    super(message || "CardanoFeeHigh");
  }
}

export class CardanoFeeTooHigh extends Error {
  override name = "CardanoFeeTooHigh";
  constructor(message?: string) {
    super(message || "CardanoFeeTooHigh");
  }
}

export class CardanoInvalidProtoParams extends Error {
  override name = "CardanoInvalidProtoParams";
  constructor(message?: string) {
    super(message || "CardanoInvalidProtoParams");
  }
}

export class CardanoMemoExceededSizeError extends Error {
  override name = "CardanoMemoExceededSizeError";
  constructor(message?: string) {
    super(message || "CardanoMemoExceededSizeError");
  }
}

export class ValAddressRequired extends Error {
  override name = "ValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ValAddressRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class AccountAwaitingSendPendingOperations extends Error {
  override name = "AccountAwaitingSendPendingOperations";
  constructor(message?: string) {
    super(message || "AccountAwaitingSendPendingOperations");
  }
}
