export class IconAllFundsWarning extends Error {
  override name = "IconAllFundsWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "IconAllFundsWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class IconValidatorsRequired extends Error {
  override name = "IconValidatorsRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "IconValidatorsRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class IconDoMaxSendInstead extends Error {
  override name = "IconDoMaxSendInstead";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "IconDoMaxSendInstead");
    if (fields) Object.assign(this, fields);
  }
}
