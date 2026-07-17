/** Cardano error thrown when transaction amount is less then minUtxo */
export class CardanoMinAmountError extends Error {
  override name = "CardanoMinAmountError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

/** Cardano error thrown when user don't have enough fund for deposit */
export class CardanoStakeKeyDepositError extends Error {
  override name = "CardanoStakeKeyDepositError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

/** Cardano error thrown when not enough funds to perform transaction */
export class CardanoNotEnoughFunds extends Error {
  override name = "CardanoNotEnoughFunds";
}

export class CardanoInvalidPoolId extends Error {
  override name = "CardanoInvalidPoolId";
}

/** Cardano warning/error for high fees */
export class CardanoFeeHigh extends Error {
  override name = "CardanoFeeHigh";
}

export class CardanoFeeTooHigh extends Error {
  override name = "CardanoFeeTooHigh";
}

export class CardanoInvalidProtoParams extends Error {
  override name = "CardanoInvalidProtoParams";
}

export class CardanoMemoExceededSizeError extends Error {
  override name = "CardanoMemoExceededSizeError";
}

export class ValAddressRequired extends Error {
  override name = "ValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class AccountAwaitingSendPendingOperations extends Error {
  override name = "AccountAwaitingSendPendingOperations";
}
