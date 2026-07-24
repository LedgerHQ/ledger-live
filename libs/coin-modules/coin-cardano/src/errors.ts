/**
 * Cardano error thrown when transaction amount is less then minUtxo
 */
export class CardanoMinAmountError extends Error {
  override name = "CardanoMinAmountError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoMinAmountError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * Cardano error thrown when user don't have enough fund for deposit
 */
export class CardanoStakeKeyDepositError extends Error {
  override name = "CardanoStakeKeyDepositError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoStakeKeyDepositError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * Cardano error thrown when not enough funds to perform transaction
 */
export class CardanoNotEnoughFunds extends Error {
  override name = "CardanoNotEnoughFunds";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoNotEnoughFunds");
    if (fields) Object.assign(this, fields);
  }
}

export class CardanoInvalidPoolId extends Error {
  override name = "CardanoInvalidPoolId";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoInvalidPoolId");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * Cardano warning/error for high fees
 */
export class CardanoFeeHigh extends Error {
  override name = "CardanoFeeHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoFeeHigh");
    if (fields) Object.assign(this, fields);
  }
}

export class CardanoFeeTooHigh extends Error {
  override name = "CardanoFeeTooHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoFeeTooHigh");
    if (fields) Object.assign(this, fields);
  }
}

export class CardanoInvalidProtoParams extends Error {
  override name = "CardanoInvalidProtoParams";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoInvalidProtoParams");
    if (fields) Object.assign(this, fields);
  }
}

export class CardanoMemoExceededSizeError extends Error {
  override name = "CardanoMemoExceededSizeError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CardanoMemoExceededSizeError");
    if (fields) Object.assign(this, fields);
  }
}
