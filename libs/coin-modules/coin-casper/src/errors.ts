export class CasperInvalidTransferId extends Error {
  override name = "CasperInvalidTransferId";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CasperInvalidTransferId");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidMinimumAmount extends Error {
  override name = "InvalidMinimumAmount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidMinimumAmount");
    if (fields) Object.assign(this, fields);
  }
}

export class MayBlockAccount extends Error {
  override name = "MayBlockAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MayBlockAccount");
    if (fields) Object.assign(this, fields);
  }
}
