export class NoDBPathGiven extends Error {
  override name = "NoDBPathGiven";
}

export class DBWrongPassword extends Error {
  override name = "DBWrongPassword";
}

export class DBNotReset extends Error {
  override name = "DBNotReset";
}

export class AccountNameRequiredError extends Error {
  override name = "AccountNameRequired";
}

export class UpdateFetchFileFail extends Error {
  override name = "UpdateFetchFileFail";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class UpdateIncorrectHash extends Error {
  override name = "UpdateIncorrectHash";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class UpdateIncorrectSig extends Error {
  override name = "UpdateIncorrectSig";
}
