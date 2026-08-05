export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnsupportedDerivation");
    if (fields) Object.assign(this, fields);
  }
}

export class AccountNotSupported extends Error {
  override name = "AccountNotSupported";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AccountNotSupported");
    if (fields) Object.assign(this, fields);
  }
}

export class AmountRequired extends Error {
  override name = "AmountRequired";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AmountRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class DeviceAppVerifyNotSupported extends Error {
  override name = "DeviceAppVerifyNotSupported";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "DeviceAppVerifyNotSupported");
    if (fields) Object.assign(this, fields);
  }
}

export class FeeNotLoaded extends Error {
  override name = "FeeNotLoaded";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FeeNotLoaded");
    if (fields) Object.assign(this, fields);
  }
}

export class FeeTooHigh extends Error {
  override name = "FeeTooHigh";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FeeTooHigh");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidAddress extends Error {
  override name = "InvalidAddress";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidAddress");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidAddressBecauseDestinationIsAlsoSource extends Error {
  override name = "InvalidAddressBecauseDestinationIsAlsoSource";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidAddressBecauseDestinationIsAlsoSource");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidTransactionError extends Error {
  override name = "InvalidTransactionError";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidTransactionError");
    if (fields) Object.assign(this, fields);
  }
}

export class LockedDeviceError extends Error {
  override name = "LockedDeviceError";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "LockedDeviceError");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalance extends Error {
  override name = "NotEnoughBalance";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "NotEnoughBalance", options);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceBecauseDestinationNotCreated extends Error {
  override name = "NotEnoughBalanceBecauseDestinationNotCreated";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughBalanceBecauseDestinationNotCreated");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceFees extends Error {
  override name = "NotEnoughBalanceFees";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "NotEnoughBalanceFees", options);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceInParentAccount extends Error {
  override name = "NotEnoughBalanceInParentAccount";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughBalanceInParentAccount");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughSpendableBalance extends Error {
  override name = "NotEnoughSpendableBalance";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughSpendableBalance");
    if (fields) Object.assign(this, fields);
  }
}

export class FeeRequired extends Error {
  override name = "FeeRequired";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FeeRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughGas extends Error {
  override name = "NotEnoughGas";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughGas");
    if (fields) Object.assign(this, fields);
  }
}

export class RecipientRequired extends Error {
  override name = "RecipientRequired";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "RecipientRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class UserRefusedAddress extends Error {
  override name = "UserRefusedAddress";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UserRefusedAddress");
    if (fields) Object.assign(this, fields);
  }
}

export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UserRefusedOnDevice");
    if (fields) Object.assign(this, fields);
  }
}

export class UpdateYourApp extends Error {
  override name = "UpdateYourApp";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UpdateYourApp");
    if (fields) Object.assign(this, fields);
  }
}

export class WrongDeviceForAccount extends Error {
  override name = "WrongDeviceForAccount";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "WrongDeviceForAccount");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughBalanceToDelegate extends Error {
  override name = "NotEnoughBalanceToDelegate";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughBalanceToDelegate");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidParameterError extends Error {
  override name = "InvalidParameterError";
  [key: string]: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidParameterError");
    if (fields) Object.assign(this, fields);
  }
}
