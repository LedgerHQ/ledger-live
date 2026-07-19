export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
  constructor(message?: string) {
    super(message ?? "UnsupportedDerivation");
  }
}

export class AmountRequired extends Error {
  override name = "AmountRequired";
  constructor(message?: string) {
    super(message ?? "AmountRequired");
  }
}

export class RecipientRequired extends Error {
  override name = "RecipientRequired";
  constructor(message?: string) {
    super(message ?? "RecipientRequired");
  }
}

export class NotEnoughBalance extends Error {
  override name = "NotEnoughBalance";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message ?? "NotEnoughBalance", options);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceFees extends Error {
  override name = "NotEnoughBalanceFees";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message ?? "NotEnoughBalanceFees", options);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceToDelegate extends Error {
  override name = "NotEnoughBalanceToDelegate";
  constructor(message?: string) {
    super(message ?? "NotEnoughBalanceToDelegate");
  }
}

export class NotEnoughBalanceInParentAccount extends Error {
  override name = "NotEnoughBalanceInParentAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "NotEnoughBalanceInParentAccount");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughSpendableBalance extends Error {
  override name = "NotEnoughSpendableBalance";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "NotEnoughSpendableBalance");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceBecauseDestinationNotCreated extends Error {
  override name = "NotEnoughBalanceBecauseDestinationNotCreated";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "NotEnoughBalanceBecauseDestinationNotCreated");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidAddress extends Error {
  override name = "InvalidAddress";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "InvalidAddress");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidAddressBecauseDestinationIsAlsoSource extends Error {
  override name = "InvalidAddressBecauseDestinationIsAlsoSource";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "InvalidAddressBecauseDestinationIsAlsoSource");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidTransactionError extends Error {
  override name = "InvalidTransactionError";
  constructor(message?: string) {
    super(message ?? "InvalidTransactionError");
  }
}

export class FeeNotLoaded extends Error {
  override name = "FeeNotLoaded";
  constructor(message?: string) {
    super(message ?? "FeeNotLoaded");
  }
}

export class FeeRequired extends Error {
  override name = "FeeRequired";
  constructor(message?: string) {
    super(message ?? "FeeRequired");
  }
}

export class FeeTooHigh extends Error {
  override name = "FeeTooHigh";
  constructor(message?: string) {
    super(message ?? "FeeTooHigh");
  }
}

export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
  constructor(message?: string) {
    super(message ?? "UserRefusedOnDevice");
  }
}

export class WrongDeviceForAccount extends Error {
  override name = "WrongDeviceForAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "WrongDeviceForAccount");
    if (fields) Object.assign(this, fields);
  }
}

export class UserRefusedAddress extends Error {
  override name = "UserRefusedAddress";
  constructor(message?: string) {
    super(message ?? "UserRefusedAddress");
  }
}

export class AccountNotSupported extends Error {
  override name = "AccountNotSupported";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "AccountNotSupported");
    if (fields) Object.assign(this, fields);
  }
}

export class DeviceAppVerifyNotSupported extends Error {
  override name = "DeviceAppVerifyNotSupported";
  constructor(message?: string) {
    super(message ?? "DeviceAppVerifyNotSupported");
  }
}
