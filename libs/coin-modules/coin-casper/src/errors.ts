export class CasperInvalidTransferId extends Error {
  override name = "CasperInvalidTransferId";
  constructor(message = "CasperInvalidTransferId", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidMinimumAmount extends Error {
  override name = "InvalidMinimumAmount";
  constructor(message = "InvalidMinimumAmount", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class MayBlockAccount extends Error {
  override name = "MayBlockAccount";
  constructor(message = "MayBlockAccount", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
