export class NoDBPathGiven extends Error {
  override name = "NoDBPathGiven";
  constructor(message?: string) {
    super(message || "NoDBPathGiven");
  }
}

export class DBWrongPassword extends Error {
  override name = "DBWrongPassword";
  constructor(message?: string) {
    super(message || "DBWrongPassword");
  }
}

export class DBNotReset extends Error {
  override name = "DBNotReset";
  constructor(message?: string) {
    super(message || "DBNotReset");
  }
}

export class AccountNameRequiredError extends Error {
  override name = "AccountNameRequired";
  constructor(message?: string) {
    super(message || "AccountNameRequired");
  }
}

export class UpdateFetchFileFail extends Error {
  override name = "UpdateFetchFileFail";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UpdateFetchFileFail");
    if (fields) Object.assign(this, fields);
  }
}

export class UpdateIncorrectHash extends Error {
  override name = "UpdateIncorrectHash";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UpdateIncorrectHash");
    if (fields) Object.assign(this, fields);
  }
}

export class UpdateIncorrectSig extends Error {
  override name = "UpdateIncorrectSig";
  constructor(message?: string) {
    super(message || "UpdateIncorrectSig");
  }
}
