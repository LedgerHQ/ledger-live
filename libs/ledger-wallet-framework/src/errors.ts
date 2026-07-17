export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
}

export class AmountRequired extends Error {
  override name = "AmountRequired";
}

export class RecipientRequired extends Error {
  override name = "RecipientRequired";
}

export class NotEnoughBalance extends Error {
  override name = "NotEnoughBalance";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message, options);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceFees extends Error {
  override name = "NotEnoughBalanceFees";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message, options);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceToDelegate extends Error {
  override name = "NotEnoughBalanceToDelegate";
}

export class NotEnoughBalanceInParentAccount extends Error {
  override name = "NotEnoughBalanceInParentAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughSpendableBalance extends Error {
  override name = "NotEnoughSpendableBalance";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceBecauseDestinationNotCreated extends Error {
  override name = "NotEnoughBalanceBecauseDestinationNotCreated";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidAddress extends Error {
  override name = "InvalidAddress";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidAddressBecauseDestinationIsAlsoSource extends Error {
  override name = "InvalidAddressBecauseDestinationIsAlsoSource";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidTransactionError extends Error {
  override name = "InvalidTransactionError";
}

export class FeeNotLoaded extends Error {
  override name = "FeeNotLoaded";
}

export class FeeRequired extends Error {
  override name = "FeeRequired";
}

export class FeeTooHigh extends Error {
  override name = "FeeTooHigh";
}

export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
}

export class WrongDeviceForAccount extends Error {
  override name = "WrongDeviceForAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class UserRefusedAddress extends Error {
  override name = "UserRefusedAddress";
}

export class AccountNotSupported extends Error {
  override name = "AccountNotSupported";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class DeviceAppVerifyNotSupported extends Error {
  override name = "DeviceAppVerifyNotSupported";
}
